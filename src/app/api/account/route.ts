import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { id: user.id }, select: { name: true, email: true, role: true } });
  return NextResponse.json(me, { headers: { "Cache-Control": "no-store" } });
}

const Body = z.object({ name: z.string().trim().min(2).max(80) });

export async function PATCH(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Enter a name (2+ characters)." }, { status: 400 });
  await prisma.user.update({ where: { id: user.id }, data: { name: p.data.name } });
  return NextResponse.json({ ok: true });
}
