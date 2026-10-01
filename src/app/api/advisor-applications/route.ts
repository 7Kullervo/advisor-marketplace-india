import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

const Body = z.object({
  categorySlug: z.string().min(1), headline: z.string().trim().min(10).max(140), bio: z.string().trim().min(30).max(1500),
  yearsExperience: z.coerce.number().int().min(0).max(60), languages: z.string().trim().min(2).max(120),
  priceRupees: z.coerce.number().int().min(100).max(100000), qualifications: z.string().trim().max(500).optional(),
});

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { id: user.id }, select: { email: true } });
  const [application, categories] = await Promise.all([
    prisma.advisorApplication.findFirst({ where: { email: me!.email }, orderBy: { createdAt: "desc" }, select: { id: true, status: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
  ]);
  return NextResponse.json({ application, categories, role: user.role });
}

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  if (user.role !== "USER") return NextResponse.json({ error: "This account can't apply." }, { status: 409 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Please complete every field (bio needs 30+ characters)." }, { status: 400 });
  const me = await prisma.user.findUnique({ where: { id: user.id } });
  if (!(await prisma.category.findUnique({ where: { slug: p.data.categorySlug } }))) return NextResponse.json({ error: "Pick a category." }, { status: 400 });
  if (await prisma.advisorApplication.findFirst({ where: { email: me!.email, status: { in: ["PENDING", "REVIEW"] } } }))
    return NextResponse.json({ error: "You already have an application in progress." }, { status: 409 });
  const { categorySlug, priceRupees, languages, ...rest } = p.data;
  await prisma.advisorApplication.create({
    data: { email: me!.email, name: me!.name, categorySlug, data: { ...rest, languages: languages.split(",").map((s) => s.trim()).filter(Boolean), pricePaise: priceRupees * 100 } },
  });
  return NextResponse.json({ ok: true });
}
