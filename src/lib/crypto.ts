/** AES-256-GCM encryption utilities for protecting local data at rest */

const ENC_KEY_STORAGE = "catto_enc_key";
const PBKDF2_ITERATIONS = 100000;

/** Derive an AES-GCM CryptoKey from password + salt */
async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(`enc_${salt}`), // different salt prefix than auth hash
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true, // extractable so we can export to sessionStorage
    ["encrypt", "decrypt"]
  );
}

/** Export CryptoKey to base64 for sessionStorage */
async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return uint8ToBase64(new Uint8Array(raw));
}

/** Import CryptoKey from base64 */
async function importKey(base64: string): Promise<CryptoKey> {
  const raw = base64ToUint8(base64);
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Store the derived encryption key in sessionStorage (clears on tab close) */
export async function storeEncryptionKey(password: string, salt: string): Promise<void> {
  const key = await deriveKey(password, salt);
  const exported = await exportKey(key);
  sessionStorage.setItem(ENC_KEY_STORAGE, exported);
}

/** Get the stored encryption key, or null if not available */
export async function getEncryptionKey(): Promise<CryptoKey | null> {
  const stored = sessionStorage.getItem(ENC_KEY_STORAGE);
  if (!stored) return null;
  try {
    return await importKey(stored);
  } catch {
    return null;
  }
}

/** Clear the encryption key (on logout) */
export function clearEncryptionKey(): void {
  sessionStorage.removeItem(ENC_KEY_STORAGE);
}

/** Convert Uint8Array to base64 (safe for large buffers) */
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Convert base64 to Uint8Array */
function base64ToUint8(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Encrypt a string with AES-256-GCM. Returns "iv:ciphertext" in base64 */
export async function encrypt(plaintext: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );
  const ivB64 = uint8ToBase64(iv);
  const ctB64 = uint8ToBase64(new Uint8Array(ciphertext));
  return `${ivB64}:${ctB64}`;
}

/** Decrypt an "iv:ciphertext" string */
export async function decrypt(encrypted: string, key: CryptoKey): Promise<string> {
  const [ivB64, ctB64] = encrypted.split(":");
  const iv = base64ToUint8(ivB64);
  const ciphertext = base64ToUint8(ctB64);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(plaintext);
}

/** Check if encryption is available (user is logged in with key in session) */
export async function isEncryptionAvailable(): Promise<boolean> {
  return (await getEncryptionKey()) !== null;
}
