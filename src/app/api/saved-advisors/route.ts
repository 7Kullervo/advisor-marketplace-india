import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const rows = await prisma.savedAdvisor.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { advisor: { include: { user: true, category: true } } } });
  return NextResponse.json({
    saved: rows.map((r) => ({ advisorSlug: r.advisor.slug, name: r.advisor.user.name, category: r.advisor.category.name, headline: r.advisor.headline, rating: r.advisor.ratingAvg })),
  }, { headers: { "Cache-Control": "no-store" } });
}

const Body = z.object({ advisorSlug: z.string() });

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const advisor = await prisma.advisor.findUnique({ where: { slug: p.data.advisorSlug } });
  if (!advisor) return NextResponse.json({ error: "Advisor not found." }, { status: 404 });
  const existing = await prisma.savedAdvisor.findUnique({ where: { userId_advisorId: { userId: user.id, advisorId: advisor.id } } });
  if (existing) { await prisma.savedAdvisor.delete({ where: { id: existing.id } }); return NextResponse.json({ saved: false }); }
  await prisma.savedAdvisor.create({ data: { userId: user.id, advisorId: advisor.id } });
  return NextResponse.json({ saved: true });
}
