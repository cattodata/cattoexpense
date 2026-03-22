/** AES-256-GCM encryption utilities for protecting local data at rest */

export const PBKDF2_ITERATIONS = 100000;

/** Module-scoped key — never exported to sessionStorage */
let cachedKey: CryptoKey | null = null;

/** Convert byte array to hex string */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Import password as PBKDF2 key material */
async function importKeyMaterial(password: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey", "deriveBits"]
  );
}

/** Derive an AES-GCM CryptoKey from password + salt (string or Uint8Array) */
export async function deriveAesKey(password: string, salt: string | Uint8Array): Promise<CryptoKey> {
  const saltBuffer = typeof salt === "string" ? new TextEncoder().encode(salt) : salt;
  const keyMaterial = await importKeyMaterial(password);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBuffer.buffer as ArrayBuffer, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Derive and hold the encryption key in memory (clears on page unload) */
export async function storeEncryptionKey(password: string, encSalt: string): Promise<void> {
  cachedKey = await deriveAesKey(password, encSalt);
}

/** Get the in-memory encryption key, or null if unavailable */
export function getEncryptionKey(): CryptoKey | null {
  return cachedKey;
}

/** Clear the encryption key from memory (on logout) */
export function clearEncryptionKey(): void {
  cachedKey = null;
}

/** Convert Uint8Array to base64 */
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
  const idx = encrypted.indexOf(":");
  const ivB64 = encrypted.slice(0, idx);
  const ctB64 = encrypted.slice(idx + 1);
  const iv = base64ToUint8(ivB64);
  const ciphertext = base64ToUint8(ctB64);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(plaintext);
}
