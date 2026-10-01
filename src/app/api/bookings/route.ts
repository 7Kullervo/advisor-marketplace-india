import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

const NO_STORE = { "Cache-Control": "no-store" };

// GET /api/bookings?as=client|advisor : only the caller's own bookings.
export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const asAdvisor = new URL(req.url).searchParams.get("as") === "advisor";
  const advisor = asAdvisor ? await prisma.advisor.findUnique({ where: { userId: user.id } }) : null;
  if (asAdvisor && !advisor) return NextResponse.json({ error: "Not an advisor account." }, { status: 403 });

  const rows = await prisma.booking.findMany({
    where: { ...(asAdvisor ? { advisorId: advisor!.id } : { userId: user.id }), status: { not: "PENDING" } },
    orderBy: { startsAt: "asc" },
    include: { service: true, payment: true, review: true, user: true, advisor: { include: { user: true, category: true } } },
  });
  const bookings = rows.map((b) => ({
    id: b.id, status: b.status, startsAt: b.startsAt, endsAt: b.endsAt, service: b.service.name,
    durationMin: b.service.durationMin, category: b.advisor.category.name,
    advisorName: b.advisor.user.name, clientName: b.user.name, reviewed: !!b.review,
  }));
  const earningsPaise = asAdvisor
    ? rows.filter((b) => b.payment?.status === "PAID" && b.status !== "CANCELLED")
        .reduce((s, b) => s + b.payment!.amountPaise - b.payment!.feePaise, 0)
    : undefined;
  return NextResponse.json({ bookings, earningsPaise }, { headers: NO_STORE });
}
