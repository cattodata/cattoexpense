/** Simple localStorage-based auth system — no server, fully local */

export interface User {
  id: string;
  username: string;
  displayName: string;
  createdAt: string;
}

interface StoredUser {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  createdAt: string;
}

const USERS_KEY = "catto_users";
const SESSION_KEY = "catto_session";

/** Simple hash for local-only password storage (NOT cryptographically secure — local only) */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "catto_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function register(username: string, displayName: string, password: string): Promise<User> {
  const users = getStoredUsers();
  if (users.find((u) => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("Username already exists");
  }
  if (password.length < 4) {
    throw new Error("Password must be at least 4 characters");
  }

  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    username: username.toLowerCase(),
    displayName,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveStoredUsers(users);

  const session: User = { id: newUser.id, username: newUser.username, displayName: newUser.displayName, createdAt: newUser.createdAt };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function login(username: string, password: string): Promise<User> {
  const users = getStoredUsers();
  const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    throw new Error("Invalid username or password");
  }

  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) {
    throw new Error("Invalid username or password");
  }

  const session: User = { id: user.id, username: user.username, displayName: user.displayName, createdAt: user.createdAt };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
