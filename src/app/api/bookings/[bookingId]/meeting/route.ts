import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAuthorizedBooking } from "@/lib/bookings";
import { canJoinConsultation, JOIN_MESSAGES } from "@/lib/joinRules";
import { jaasEnabled, jaasToken } from "@/lib/jaas";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(req: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ code: "unauthorized", error: "Please log in to join." }, { status: 401 });

  const { bookingId } = await params;
  const found = await getAuthorizedBooking(bookingId, user.id);
  if (!found) return NextResponse.json({ code: "forbidden", error: "You don't have access to this consultation." }, { status: 404 });
  const { booking: b, role } = found;

  const paid = b.payment?.status === "PAID";
  const check = paid
  ? canJoinConsultation(b)
  : ({ ok: false, reason: "unconfirmed" } as const);

if (check.ok === false) {
  const reason = check.reason;

  return NextResponse.json(
    {
      code: reason,
      error: JOIN_MESSAGES[reason],
      startsAt: b.startsAt,
      endsAt: b.endsAt,
    },
    { status: 403, headers: NO_STORE },
  );
}

  const me = role === "client" ? b.user : b.advisor.user;
  const other = role === "client" ? b.advisor.user : b.user;
  const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN ?? "meet.jit.si";
  const jaas = jaasEnabled()
    ? {
        roomName: `${process.env.JAAS_APP_ID}/${b.jitsiRoomName}`,
        scriptSrc: `https://${domain}/${process.env.JAAS_APP_ID}/external_api.js`,
        jwt: jaasToken({ room: b.jitsiRoomName!, name: me.name, email: me.email, userId: me.id, moderator: role === "advisor", endsAt: b.endsAt }),
      }
    : null;
  return NextResponse.json(
    {
      bookingId: b.id, roomName: jaas?.roomName ?? b.jitsiRoomName, domain, scriptSrc: jaas?.scriptSrc, jwt: jaas?.jwt,
      role, displayName: me.name, email: me.email, otherName: other.name,
      service: b.service.name, durationMin: b.service.durationMin, startsAt: b.startsAt, endsAt: b.endsAt,
    },
    { headers: NO_STORE },
  );
}
