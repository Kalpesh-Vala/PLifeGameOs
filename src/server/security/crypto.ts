import crypto from "node:crypto";
import { env } from "@/env";

/**
 * Field-level encryption for sensitive content at rest (journal, notes).
 *
 * Design goals:
 * - **Backward compatible**: legacy plaintext values (no prefix) are returned
 *   as-is on decrypt, so existing data keeps working.
 * - **Opt-in**: when `ENCRYPTION_KEY` is unset, encryption is a no-op and
 *   values are stored as plaintext — the app runs unchanged.
 * - **Authenticated**: AES-256-GCM with a random IV per value and an auth tag,
 *   so tampering/corruption fails closed.
 *
 * Encrypted values are stored as `enc:v1:<base64(iv | tag | ciphertext)>`.
 */

const PREFIX = "enc:v1:";
const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

let cachedKey: Buffer | null | undefined;

function getKey(): Buffer | null {
  if (cachedKey !== undefined) return cachedKey;
  const raw = env.ENCRYPTION_KEY;
  // Derive a fixed 32-byte key from the provided secret of any length.
  cachedKey = raw ? crypto.createHash("sha256").update(raw).digest() : null;
  return cachedKey;
}

/** Whether at-rest encryption is enabled (a key is configured). */
export function isEncryptionEnabled(): boolean {
  return getKey() !== null;
}

/** Whether a stored value is in encrypted form. */
export function isEncrypted(value: string): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

/**
 * Encrypts a plaintext string for storage. Returns the input unchanged when
 * encryption is disabled, the value is empty, or it is already encrypted.
 */
export function encryptField(plain: string): string {
  const key = getKey();
  if (!key || !plain || isEncrypted(plain)) return plain;

  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, enc]).toString("base64");
}

/**
 * Decrypts a stored value. Plaintext (unprefixed) values are returned as-is.
 * If the key is missing or the payload is corrupt, the raw value is returned
 * rather than throwing, so a read never crashes.
 */
export function decryptField(value: string): string {
  if (!value || !isEncrypted(value)) return value;
  const key = getKey();
  if (!key) return value;

  try {
    const buf = Buffer.from(value.slice(PREFIX.length), "base64");
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const data = buf.subarray(IV_LEN + TAG_LEN);
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      "utf8",
    );
  } catch {
    return value;
  }
}

/** Encrypts a nullable field (passes through null/undefined). */
export function encryptNullable<T extends string | null | undefined>(
  value: T,
): T {
  return (typeof value === "string" ? encryptField(value) : value) as T;
}

/** Decrypts a nullable field (passes through null/undefined). */
export function decryptNullable<T extends string | null | undefined>(
  value: T,
): T {
  return (typeof value === "string" ? decryptField(value) : value) as T;
}
