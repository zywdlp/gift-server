import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomInt } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey() {
  const secret = process.env.CARD_SECRET_KEY;
  if (secret) return createHash("sha256").update(secret).digest();
  if (process.env.NODE_ENV === "production") {
    throw new Error("生产环境必须配置独立的 CARD_SECRET_KEY");
  }
  // 仅供本地开发兼容既有测试数据，生产环境绝不允许复用 JWT 密钥。
  return createHash("sha256").update(process.env.JWT_SECRET_KEY || "gift-card-secret").digest();
}

export function generatePin() {
  return String(randomInt(100000, 1_000_000));
}

export function generateQrToken() {
  return randomBytes(24).toString("base64url");
}

export function hashCardSecret(value: string) {
  return createHmac("sha256", getKey()).update(value).digest("hex");
}

export function encryptCardSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

export function decryptCardSecret(value: string) {
  const payload = Buffer.from(value, "base64");
  const iv = payload.subarray(0, 12);
  const authTag = payload.subarray(12, 28);
  const ciphertext = payload.subarray(28);
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
