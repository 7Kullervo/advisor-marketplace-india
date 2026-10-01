import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAuthorizedBooking } from "@/lib/bookings";

export async function GET(req: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const f = await getAuthorizedBooking((await params).bookingId, user.id);
  if (!f) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  const { booking: b, role } = f;
  return NextResponse.json(
    {
      id: b.id, status: b.status, role, startsAt: b.startsAt, endsAt: b.endsAt, service: b.service.name,
      durationMin: b.service.durationMin, otherName: role === "client" ? b.advisor.user.name : b.user.name,
      amountPaise: role === "client" && b.payment?.status === "PAID" ? b.payment.amountPaise : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
