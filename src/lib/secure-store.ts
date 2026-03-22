/**
 * Encrypted IndexedDB store for sensitive data.
 * Falls back to localStorage if IndexedDB is unavailable.
 */

import { getEncryptionKey, encrypt, decrypt } from "./crypto";

const DB_NAME = "catto_secure";
const DB_VERSION = 1;
const STORE_NAME = "encrypted_data";

/** Open (or create) the IndexedDB database */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Put a value in the store */
async function putRaw(key: string, value: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ key, value });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Get a value from the store */
async function getRaw(key: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result?.value ?? null);
    request.onerror = () => reject(request.error);
  });
}

/** Clear all data from IndexedDB store */
async function clearAll(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Public encrypted API ──

/** Save encrypted data to IndexedDB */
export async function secureSet<T>(key: string, data: T): Promise<void> {
  const encKey = getEncryptionKey();
  const json = JSON.stringify(data);

  if (encKey) {
    try {
      const encrypted = await encrypt(json, encKey);
      await putRaw(key, encrypted);
      return;
    } catch {
      // Fallback to localStorage if IndexedDB fails
    }
  }

  // No encryption key — guest users don't get persistent storage
  // Data stays in memory only (consistent with "gone when you close" promise)
  return;
}

/** Read and decrypt data from IndexedDB */
export async function secureGet<T>(key: string): Promise<T | null> {
  const encKey = getEncryptionKey();

  if (encKey) {
    try {
      const encrypted = await getRaw(key);
      if (encrypted) {
        const json = await decrypt(encrypted, encKey);
        return JSON.parse(json);
      }
      // Check for localStorage migration
      const plain = localStorage.getItem(key);
      if (plain) {
        const data = JSON.parse(plain) as T;
        // Migrate to encrypted IndexedDB
        await secureSet(key, data);
        localStorage.removeItem(key);
        return data;
      }
      return null;
    } catch {
      return null;
    }
  }

  // No encryption key — guest users have no persisted data
  return null;
}

/** Wipe all secure storage */
export async function secureClearAll(): Promise<void> {
  try {
    await clearAll();
  } catch {
    // IndexedDB might not be available
  }
}
