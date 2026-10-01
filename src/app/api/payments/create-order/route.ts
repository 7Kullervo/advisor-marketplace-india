import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import { getSessionUser } from "@/lib/auth";
import { getSlots, localDate } from "@/lib/slots";

const Body = z.object({ serviceId: z.string(), startsAt: z.string().datetime() });

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const service = await prisma.service.findFirst({ where: { id: parsed.data.serviceId, active: true, advisor: { verified: true } } });
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const startsAt = new Date(parsed.data.startsAt);
  if (startsAt <= new Date()) return NextResponse.json({ error: "Pick a future time" }, { status: 400 });
  const endsAt = new Date(startsAt.getTime() + service.durationMin * 60_000);

  // Server-side availability check: the time must be one of the advisor's open slots.
  const open = await getSlots(service.advisorId, service.durationMin, localDate(startsAt));
  if (!open.some((d) => d.getTime() === startsAt.getTime()))
    return NextResponse.json({ error: "That time isn't available." }, { status: 409 });

  // Price is computed server-side, never taken from the client.
  const feePaise = Math.round((service.pricePaise * Number(process.env.PLATFORM_FEE_PERCENT ?? 10)) / 100);
  const amountPaise = service.pricePaise + feePaise;

  try {
    // Free the slot if an earlier hold never finished paying (15 min).
    await prisma.booking.updateMany({
      where: { advisorId: service.advisorId, startsAt, status: "PENDING", createdAt: { lt: new Date(Date.now() - 15 * 60_000) } },
      data: { status: "CANCELLED" },
    });
    // The partial unique index (PENDING/CONFIRMED) holds the slot; a clash throws P2002.
    const booking = await prisma.booking.create({
      data: { userId: user.id, advisorId: service.advisorId, serviceId: service.id, startsAt, endsAt },
    });
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: booking.id,
      notes: { bookingId: booking.id },
    });
    await prisma.payment.create({
      data: { bookingId: booking.id, razorpayOrderId: order.id, amountPaise, feePaise },
    });
    return NextResponse.json({
      bookingId: booking.id,
      orderId: order.id,
      amount: amountPaise,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID, // public key id only
    });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "That time was just taken" }, { status: 409 });
    return NextResponse.json({ error: "Could not start payment" }, { status: 500 });
  }
}
