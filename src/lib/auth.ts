import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const DAY = 86_400;
function sign(v: string) {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set (32+ chars)");
  return crypto.createHmac("sha256", s).update(v).digest("base64url");
}
const secure = () => (process.env.NODE_ENV === "production" ? "; Secure" : "");

export function makeSessionCookie(userId: string) {
  const v = `${userId}.${Date.now() + 7 * DAY * 1000}`;
  return `session=${v}.${sign(v)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${7 * DAY}${secure()}`;
}
export const clearSessionCookie = () => `session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure()}`;

export async function getSessionUser(req: Request): Promise<{ id: string; role: "USER" | "ADVISOR" | "ADMIN" } | null> {
  const raw = /(?:^|;\s*)session=([^;]+)/.exec(req.headers.get("cookie") ?? "")?.[1];
  const [id, exp, sig] = raw?.split(".") ?? [];
  if (!id || !exp || !sig || Number(exp) < Date.now()) return null;
  const good = Buffer.from(sign(`${id}.${exp}`)), got = Buffer.from(sig);
  if (good.length !== got.length || !crypto.timingSafeEqual(good, got)) return null;
  return prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
}
