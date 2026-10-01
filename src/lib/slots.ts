import { prisma } from "@/lib/prisma";

// Availability minutes are in the platform timezone (fixed offset, no DST).
const OFFSET = Number(process.env.PLATFORM_UTC_OFFSET_MIN ?? 330);
export const localDate = (d: Date) => new Date(d.getTime() + OFFSET * 60_000).toISOString().slice(0, 10);

export async function getSlots(advisorId: string, durationMin: number, date: string): Promise<Date[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
  const midnightUtc = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(midnightUtc)) return [];
  const dayStart = midnightUtc - OFFSET * 60_000;
  const weekday = new Date(midnightUtc).getUTCDay();
  const [rules, taken] = await Promise.all([
    prisma.availability.findMany({ where: { advisorId, weekday } }),
    prisma.booking.findMany({
      where: {
        advisorId, startsAt: { gte: new Date(dayStart - 864e5) }, endsAt: { lte: new Date(dayStart + 2 * 864e5) },
        OR: [{ status: "CONFIRMED" }, { status: "PENDING", createdAt: { gt: new Date(Date.now() - 15 * 60_000) } }],
      },
      select: { startsAt: true, endsAt: true },
    }),
  ]);
  const now = Date.now(), out: Date[] = [];
  for (const r of rules)
    for (let m = r.startMin; m + durationMin <= r.endMin; m += durationMin) {
      const s = dayStart + m * 60_000, e = s + durationMin * 60_000;
      if (s <= now || taken.some((t) => t.startsAt.getTime() < e && t.endsAt.getTime() > s)) continue;
      out.push(new Date(s));
    }
  return out.sort((a, b) => a.getTime() - b.getTime());
}
