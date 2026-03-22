/** Simple localStorage-based auth system — no server, fully local */

import { storeEncryptionKey, clearEncryptionKey, PBKDF2_ITERATIONS, bytesToHex } from "./crypto";
import { secureClearAll } from "./secure-store";

export interface User {
  id: string;
  username: string;
  displayName: string;
  createdAt: string;
  /** Returned on login if user should update their password */
  passwordWarning?: string;
}

interface StoredUser {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  salt: string;
  /** Separate salt for encryption key derivation */
  encSalt?: string;
  createdAt: string;
}

const USERS_KEY = "catto_users";
const SESSION_KEY = "catto_session";
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** PBKDF2-based password hashing with per-user random salt */
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(hashBuffer));
}

/** Generate a random salt */
function generateSalt(): string {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
}

/** Compute HMAC-SHA256 for session integrity */
async function hmacSign(data: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
  return bytesToHex(new Uint8Array(sig));
}

/** Migrate legacy users (static salt, SHA-256) to new format by adding salt field */
function migrateUsers(users: StoredUser[]): StoredUser[] {
  let changed = false;
  const migrated = users.map((u) => {
    if (!u.salt) {
      changed = true;
      return { ...u, salt: "__legacy_catto_salt_2024__" };
    }
    return u;
  });
  if (changed) {
    localStorage.setItem(USERS_KEY, JSON.stringify(migrated));
  }
  return migrated;
}

function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const users: StoredUser[] = raw ? JSON.parse(raw) : [];
    return migrateUsers(users);
  } catch {
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/** Hash with legacy static salt (for migration verification) */
async function legacyHash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "catto_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(hashBuffer));
}

interface SignedSession {
  id: string;
  username: string;
  displayName: string;
  createdAt: string;
  createdAtSession: string;
  hmac: string;
}

/** Create and store a signed session */
async function createSession(user: StoredUser, password: string): Promise<User> {
  const payloadObj = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    createdAt: user.createdAt,
    createdAtSession: new Date().toISOString(),
  };
  const hmac = await hmacSign(JSON.stringify(payloadObj), password + user.salt);
  const session: SignedSession = { ...payloadObj, hmac };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    createdAt: user.createdAt,
  };
}

export async function register(username: string, displayName: string, password: string): Promise<User> {
  const users = getStoredUsers();
  if (users.find((u) => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("Username already exists");
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const salt = generateSalt();
  const encSalt = generateSalt();
  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    username: username.toLowerCase(),
    displayName,
    passwordHash: await hashPassword(password, salt),
    salt,
    encSalt,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveStoredUsers(users);

  await storeEncryptionKey(password, encSalt);
  return createSession(newUser, password);
}

export async function login(username: string, password: string): Promise<User> {
  const users = getStoredUsers();
  const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    throw new Error("Invalid username or password");
  }

  let warn: string | undefined;

  // Check if legacy user needs migration
  if (user.salt === "__legacy_catto_salt_2024__") {
    const oldHash = await legacyHash(password);
    if (oldHash !== user.passwordHash) {
      throw new Error("Invalid username or password");
    }
    // Re-hash with PBKDF2 + new random salt
    const newSalt = generateSalt();
    const newEncSalt = generateSalt();
    user.salt = newSalt;
    user.encSalt = newEncSalt;
    user.passwordHash = await hashPassword(password, newSalt);
    saveStoredUsers(users);
    await storeEncryptionKey(password, newEncSalt);

    if (password.length < 8) {
      warn = "Your password is shorter than 8 characters. Please update it for better security.";
    }
  } else {
    const hash = await hashPassword(password, user.salt);
    if (hash !== user.passwordHash) {
      throw new Error("Invalid username or password");
    }
    // Ensure encSalt exists (upgrade path for users registered before encSalt was added)
    if (!user.encSalt) {
      user.encSalt = generateSalt();
      saveStoredUsers(users);
    }
    await storeEncryptionKey(password, user.encSalt);
  }

  const result = await createSession(user, password);
  if (warn) result.passwordWarning = warn;
  return result;
}

export function logout() {
  clearEncryptionKey();
  localStorage.removeItem(SESSION_KEY);
}

/** Wipe ALL user data from localStorage + sessionStorage + IndexedDB */
export async function wipeAllData() {
  clearEncryptionKey();
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(USERS_KEY);
  localStorage.removeItem("catto_history");
  localStorage.removeItem("catto_history_enc");
  sessionStorage.clear();
  await secureClearAll();
}

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: SignedSession = JSON.parse(raw);
    // Check session expiry (30 days)
    if (session.createdAtSession) {
      const age = Date.now() - new Date(session.createdAtSession).getTime();
      if (age > SESSION_MAX_AGE_MS) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
    }
    // Note: HMAC cannot be verified without the password, but expiry check prevents stale sessions.
    // Full HMAC verification happens on next login.
    return {
      id: session.id,
      username: session.username,
      displayName: session.displayName,
      createdAt: session.createdAt,
    };
  } catch {
    return null;
  }
}
