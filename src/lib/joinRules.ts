export const JOIN_EARLY_MINUTES = Number(process.env.NEXT_PUBLIC_JOIN_EARLY_MINUTES ?? 15);
export type JoinReason = "unconfirmed" | "cancelled" | "no_room" | "too_early" | "ended";
export const JOIN_MESSAGES: Record<JoinReason, string> = {
  unconfirmed: "This booking isn't confirmed yet.",
  cancelled: "This consultation was cancelled.",
  no_room: "Your meeting room isn't ready. Please try again shortly.",
  too_early: `Your consultation hasn't started yet. You can join ${JOIN_EARLY_MINUTES} minutes before the scheduled time.`,
  ended: "This consultation has ended.",
};
type B = { status: string; startsAt: Date | string; endsAt: Date | string; jitsiRoomName?: string | null };

// Pure and shared: the API enforces it, the UI only mirrors it.
export function canJoinConsultation(b: B, now = new Date()): { ok: true } | { ok: false; reason: JoinReason } {
  if (b.status === "CANCELLED" || b.status === "NO_SHOW") return { ok: false, reason: "cancelled" };
  if (b.status === "COMPLETED") return { ok: false, reason: "ended" };
  if (b.status !== "CONFIRMED") return { ok: false, reason: "unconfirmed" };
  const t = now.getTime(), s = new Date(b.startsAt).getTime(), e = new Date(b.endsAt).getTime();
  if (t >= e) return { ok: false, reason: "ended" };
  if (t < s - JOIN_EARLY_MINUTES * 60_000) return { ok: false, reason: "too_early" };
  if (b.jitsiRoomName !== undefined && !b.jitsiRoomName) return { ok: false, reason: "no_room" };
  return { ok: true };
}
