import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isValidSignature } from "@/lib/razorpay";
import { getSessionUser } from "@/lib/auth";
import { createJitsiRoom } from "@/lib/jitsi";
import { notify } from "@/lib/notifications";

const Body = z.discriminatedUnion("outcome", [
  z.object({
    outcome: z.literal("success"),
    razorpay_order_id: z.string(),
    razorpay_payment_id: z.string(),
    razorpay_signature: z.string(),
  }),
  z.object({ outcome: z.enum(["failed", "cancelled"]), razorpay_order_id: z.string() }),
]);

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const d = parsed.data;

  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: d.razorpay_order_id },
    include: { booking: true },
  });
  // Ownership check: users can only touch their own bookings.
  if (!payment || payment.booking.userId !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (payment.status === "PAID") return NextResponse.json({ bookingId: payment.bookingId }); // idempotent
  // Hold expired or cancelled: never confirm it. (Late payments need a manual/automatic refund.)
  if (payment.booking.status !== "PENDING")
    return NextResponse.json({ error: "This booking is no longer available. If you were charged, contact support for a refund." }, { status: 409 });

  if (d.outcome !== "success") {
    // Release the slot so someone else can book it.
    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: d.outcome === "failed" ? "FAILED" : "CANCELLED" } }),
      prisma.booking.update({ where: { id: payment.bookingId }, data: { status: "CANCELLED" } }),
    ]);
    return NextResponse.json({ status: d.outcome });
  }

  if (!isValidSignature(d.razorpay_order_id, d.razorpay_payment_id, d.razorpay_signature))
    return NextResponse.json({ error: "Signature mismatch" }, { status: 400 });

  await prisma.$transaction([
    prisma.payment.update({ where: { id: payment.id }, data: { status: "PAID", razorpayPaymentId: d.razorpay_payment_id } }),
    prisma.booking.update({ where: { id: payment.bookingId }, data: { status: "CONFIRMED", jitsiRoomName: createJitsiRoom() } }),
  ]);
  const svc = await prisma.service.findUnique({ where: { id: payment.booking.serviceId }, select: { name: true } });
  await notify(user.id, "booking_confirmed", {
    bookingId: payment.bookingId, service: svc?.name, startsAt: payment.booking.startsAt.toISOString(),
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/consultation/${payment.bookingId}`,
  }).catch(console.error);
  return NextResponse.json({ bookingId: payment.bookingId, status: "confirmed" });
}
