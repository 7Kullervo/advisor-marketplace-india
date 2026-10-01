import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { makeSessionCookie } from "@/lib/auth";

const Body = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().toLowerCase().email(), password: z.string().min(8).max(128) });

export async function POST(req: Request) {
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Enter a name, a valid email, and a password of 8+ characters." }, { status: 400 });
  try {
    // Role is always USER here; advisors/admins are granted server-side only.
    const u = await prisma.user.create({ data: { name: p.data.name, email: p.data.email, passwordHash: hashPassword(p.data.password) } });
    return NextResponse.json({ ok: true }, { headers: { "Set-Cookie": makeSessionCookie(u.id) } });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "That email is already registered." }, { status: 409 });
    return NextResponse.json({ error: "Could not create account." }, { status: 500 });
  }
}
