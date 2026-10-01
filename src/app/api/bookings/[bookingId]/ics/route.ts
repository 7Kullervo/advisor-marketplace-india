import { getSessionUser } from "@/lib/auth";
import { getAuthorizedBooking } from "@/lib/bookings";

const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/[\\,;]/g, (m) => "\\" + m);

export async function GET(req: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const f = await getAuthorizedBooking((await params).bookingId, user.id);
  if (!f || f.booking.status !== "CONFIRMED" || f.booking.payment?.status !== "PAID") return new Response("Not found", { status: 404 });
  const b = f.booking;
  // The event links to our authenticated consultation page, never the raw Jitsi room.
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin}/consultation/${b.id}`;
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AdvisorHub//EN", "BEGIN:VEVENT",
    `UID:${b.id}@advisorhub`, `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(b.startsAt)}`, `DTEND:${fmt(b.endsAt)}`,
    `SUMMARY:${esc(`${b.service.name} with ${b.advisor.user.name}`)}`, `DESCRIPTION:${esc(`Join: ${url}`)}`, `URL:${url}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  return new Response(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="consultation-${b.id}.ics"` } });
}
