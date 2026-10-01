import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { makeSessionCookie } from "@/lib/auth";

const Body = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(128) });
const DUMMY = hashPassword("dummy-password"); // keeps timing similar for unknown emails
const tries = new Map<string, { n: number; reset: number }>(); // in-memory: single server only

export async function POST(req: Request) {
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  const key = `${req.headers.get("x-forwarded-for") ?? "local"}:${p.data.email}`;
  const t = tries.get(key);
  if (t && t.reset > Date.now() && t.n >= 10) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });

  const u = await prisma.user.findUnique({ where: { email: p.data.email } });
  const ok = verifyPassword(p.data.password, u?.passwordHash ?? DUMMY) && !!u;
  if (!ok) {
    tries.set(key, { n: (t && t.reset > Date.now() ? t.n : 0) + 1, reset: t && t.reset > Date.now() ? t.reset : Date.now() + 15 * 60_000 });
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  tries.delete(key);
  return NextResponse.json({ ok: true }, { headers: { "Set-Cookie": makeSessionCookie(u!.id) } });
}
