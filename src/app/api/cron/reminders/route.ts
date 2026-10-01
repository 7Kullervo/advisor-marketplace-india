import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

// Run every ~10 min. Protected by CRON_SECRET (Vercel Cron sends it as a Bearer token).
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return new Response("Unauthorized", { status: 401 });
  const now = Date.now(), MIN = 60_000, base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  let sent = 0;
  for (const [template, from, to] of [["reminder_24h", now + 23 * 60 * MIN, now + 24 * 60 * MIN], ["reminder_15m", now, now + 15 * MIN]] as const) {
    const bookings = await prisma.booking.findMany({
      where: { status: "CONFIRMED", startsAt: { gt: new Date(from), lte: new Date(to) } },
      include: { service: true, advisor: { select: { userId: true } } },
    });
    for (const b of bookings)
      for (const uid of [b.userId, b.advisor.userId]) {
        const done = await prisma.notification.findFirst({ where: { userId: uid, template, payload: { path: ["bookingId"], equals: b.id } }, select: { id: true } });
        if (done) continue; // already reminded
        await notify(uid, template, { bookingId: b.id, service: b.service.name, startsAt: b.startsAt.toISOString(), url: `${base}/consultation/${b.id}` });
        sent++;
      }
  }
  return Response.json({ sent });
}
