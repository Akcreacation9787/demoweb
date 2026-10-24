import { createCipheriv, randomBytes } from "node:crypto";

function getKey() {
  const encoded = process.env.ID_NUMBER_ENCRYPTION_KEY;
  const key = encoded ? Buffer.from(encoded, "base64") : Buffer.alloc(0);
  if (key.length !== 32) throw new Error("ID_NUMBER_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  return key;
}

export function encryptIdNumber(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${ciphertext.toString("base64url")}`;
}
