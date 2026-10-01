import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const rows = await prisma.payment.findMany({
    where: { booking: { userId: user.id }, status: { not: "CREATED" } }, orderBy: { createdAt: "desc" },
    include: { booking: { include: { service: true, advisor: { include: { user: true } } } } },
  });
  return NextResponse.json({
    payments: rows.map((p) => ({ id: p.id, bookingId: p.bookingId, status: p.status, amountPaise: p.amountPaise, createdAt: p.createdAt, service: p.booking.service.name, advisorName: p.booking.advisor.user.name })),
  }, { headers: { "Cache-Control": "no-store" } });
}
