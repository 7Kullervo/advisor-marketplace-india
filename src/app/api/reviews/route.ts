import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

const Body = z.object({ bookingId: z.string(), rating: z.number().int().min(1).max(5), body: z.string().trim().min(5).max(1000) });

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Pick a rating and write a few words." }, { status: 400 });
  const b = await prisma.booking.findUnique({ where: { id: p.data.bookingId }, include: { review: true, payment: true } });
  if (!b || b.userId !== user.id) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  if (b.payment?.status !== "PAID" || !["CONFIRMED", "COMPLETED"].includes(b.status) || b.endsAt > new Date())
    return NextResponse.json({ error: "You can review after the consultation." }, { status: 409 });
  if (b.review) return NextResponse.json({ error: "You already reviewed this consultation." }, { status: 409 });
  try {
    await prisma.review.create({ data: { bookingId: b.id, userId: user.id, rating: p.data.rating, body: p.data.body } });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "You already reviewed this consultation." }, { status: 409 });
    throw e;
  }
  const avg = await prisma.review.aggregate({ where: { booking: { advisorId: b.advisorId } }, _avg: { rating: true } });
  await prisma.advisor.update({ where: { id: b.advisorId }, data: { ratingAvg: avg._avg.rating ?? 0 } });
  return NextResponse.json({ ok: true });
}
