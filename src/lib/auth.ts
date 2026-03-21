/** Simple localStorage-based auth system — no server, fully local */

import { storeEncryptionKey, clearEncryptionKey } from "./crypto";
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
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Generate a random salt */
function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Migrate legacy users (static salt, SHA-256) to new format by adding salt field */
function migrateUsers(users: StoredUser[]): StoredUser[] {
  let changed = false;
  const migrated = users.map((u) => {
    if (!u.salt) {
      // Legacy user — mark with old static salt so login can verify then re-hash
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
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface SessionData extends User {
  createdAtSession: string;
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
  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    username: username.toLowerCase(),
    displayName,
    passwordHash: await hashPassword(password, salt),
    salt,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveStoredUsers(users);

  // Derive and store encryption key for history encryption
  await storeEncryptionKey(password, salt);

  const session: SessionData = {
    id: newUser.id,
    username: newUser.username,
    displayName: newUser.displayName,
    createdAt: newUser.createdAt,
    createdAtSession: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function login(username: string, password: string): Promise<User> {
  const users = getStoredUsers();
  const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    throw new Error("Invalid username or password");
  }

  // Check if legacy user needs migration
  if (user.salt === "__legacy_catto_salt_2024__") {
    const oldHash = await legacyHash(password);
    if (oldHash !== user.passwordHash) {
      throw new Error("Invalid username or password");
    }
    // Re-hash with PBKDF2 + new random salt
    const newSalt = generateSalt();
    user.salt = newSalt;
    user.passwordHash = await hashPassword(password, newSalt);
    saveStoredUsers(users);

    await storeEncryptionKey(password, newSalt);

    // Warn if legacy password is weak
    if (password.length < 8) {
      const session: SessionData = {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        createdAt: user.createdAt,
        createdAtSession: new Date().toISOString(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return {
        ...session,
        passwordWarning: "Your password is shorter than 8 characters. Please update it for better security.",
      };
    }
  } else {
    const hash = await hashPassword(password, user.salt);
    if (hash !== user.passwordHash) {
      throw new Error("Invalid username or password");
    }
    await storeEncryptionKey(password, user.salt);
  }

  const session: SessionData = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    createdAt: user.createdAt,
    createdAtSession: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
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
    const session: SessionData = JSON.parse(raw);
    // Check session expiry (30 days)
    if (session.createdAtSession) {
      const age = Date.now() - new Date(session.createdAtSession).getTime();
      if (age > SESSION_MAX_AGE_MS) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
    }
    return session;
  } catch {
    return null;
  }
}
