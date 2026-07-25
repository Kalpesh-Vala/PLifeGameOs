import { describe, it, expect } from "vitest";
import {
  encryptField,
  decryptField,
  encryptNullable,
  decryptNullable,
  isEncrypted,
  isEncryptionEnabled,
} from "./crypto";

// vitest.config.ts sets ENCRYPTION_KEY, so encryption is enabled here.

describe("field encryption", () => {
  it("is enabled when a key is configured", () => {
    expect(isEncryptionEnabled()).toBe(true);
  });

  it("round-trips plaintext through encrypt/decrypt", () => {
    const secret = "My private journal entry — 日本語 & emojis 🔒";
    const enc = encryptField(secret);
    expect(enc).not.toBe(secret);
    expect(isEncrypted(enc)).toBe(true);
    expect(decryptField(enc)).toBe(secret);
  });

  it("produces a different ciphertext each time (random IV)", () => {
    const a = encryptField("same input");
    const b = encryptField("same input");
    expect(a).not.toBe(b);
    expect(decryptField(a)).toBe("same input");
    expect(decryptField(b)).toBe("same input");
  });

  it("does not double-encrypt an already-encrypted value", () => {
    const once = encryptField("hello");
    expect(encryptField(once)).toBe(once);
  });

  it("treats legacy plaintext as-is on decrypt (backward compatible)", () => {
    expect(decryptField("plain legacy text")).toBe("plain legacy text");
    expect(isEncrypted("plain legacy text")).toBe(false);
  });

  it("passes empty strings through untouched", () => {
    expect(encryptField("")).toBe("");
    expect(decryptField("")).toBe("");
  });

  it("returns the raw value when the payload is corrupt", () => {
    expect(decryptField("enc:v1:not-valid-base64!!")).toBe(
      "enc:v1:not-valid-base64!!",
    );
  });

  it("handles nullable helpers", () => {
    expect(encryptNullable(null)).toBeNull();
    expect(decryptNullable(undefined)).toBeUndefined();
    const enc = encryptNullable("secret");
    expect(isEncrypted(enc as string)).toBe(true);
    expect(decryptNullable(enc)).toBe("secret");
  });
});
