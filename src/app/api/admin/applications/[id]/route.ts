import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

const Body = z.object({ action: z.enum(["review", "approve", "reject"]) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getSessionUser(req);
  if (!admin) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  if (admin.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  const { id } = await params;
  const app = await prisma.advisorApplication.findUnique({ where: { id } });
  if (!app || !["PENDING", "REVIEW"].includes(app.status)) return NextResponse.json({ error: "Application not open." }, { status: 404 });

  if (p.data.action === "review") await prisma.advisorApplication.update({ where: { id }, data: { status: "REVIEW" } });
  else if (p.data.action === "reject") await prisma.advisorApplication.update({ where: { id }, data: { status: "REJECTED" } });
  else {
    const [u, cat] = await Promise.all([prisma.user.findUnique({ where: { email: app.email } }), prisma.category.findUnique({ where: { slug: app.categorySlug } })]);
    if (!u || !cat) return NextResponse.json({ error: "Applicant or category no longer exists." }, { status: 409 });
    const d = app.data as any;
    const slug = `${app.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${crypto.randomBytes(2).toString("hex")}`;
    await prisma.$transaction([
      prisma.advisor.create({ data: {
        slug, userId: u.id, categoryId: cat.id, headline: d.headline, bio: d.bio, yearsExperience: d.yearsExperience, languages: d.languages, verified: true,
        services: { create: [{ name: "30-min consultation", durationMin: 30, pricePaise: d.pricePaise }] },
        availability: { create: [1, 2, 3, 4, 5].map((weekday) => ({ weekday, startMin: 600, endMin: 1020 })) }, // default hours until editing is built
      } }),
      prisma.user.updateMany({ where: { id: u.id, role: "USER" }, data: { role: "ADVISOR" } }),
      prisma.advisorApplication.update({ where: { id }, data: { status: "APPROVED" } }),
    ]);
  }
  return NextResponse.json({ ok: true });
}
