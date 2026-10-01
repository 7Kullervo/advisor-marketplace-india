import crypto from "crypto";
export function hashPassword(pw: string) {
  const salt = crypto.randomBytes(16);
  return `${salt.toString("hex")}:${crypto.scryptSync(pw, salt, 64).toString("hex")}`;
}
export function verifyPassword(pw: string, stored: string) {
  const [s, k] = stored.split(":");
  if (!s || !k) return false;
  const key = crypto.scryptSync(pw, Buffer.from(s, "hex"), 64), kb = Buffer.from(k, "hex");
  return kb.length === key.length && crypto.timingSafeEqual(kb, key);
}
