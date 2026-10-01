"use client";
import Link from "next/link";
import JoinConsultationButton from "./JoinConsultationButton";

export type BookingItem = {
  id: string; status: string; startsAt: string; endsAt: string; service: string;
  durationMin: number; category: string; advisorName: string; clientName: string; reviewed?: boolean;
};
function until(iso: string) {
  const m = Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 60_000));
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

export default function BookingCard({ b, viewer }: { b: BookingItem; viewer: "client" | "advisor" }) {
  const s = new Date(b.startsAt), over = new Date(b.endsAt) < new Date();
  const label = b.status === "CANCELLED" ? "Cancelled" : b.status === "NO_SHOW" ? "No-show" : over || b.status === "COMPLETED" ? "Completed" : "Confirmed";
  const active = label === "Confirmed";
  return (
    <article className="flex flex-col gap-3 rounded-3xl bg-white p-5 sm:flex-row sm:items-center">
      <div className="flex-1">
        <p className="font-semibold">{viewer === "client" ? b.advisorName : b.clientName}</p>
        <p className="text-sm text-black/60">{b.category} · {b.service}</p>
        <p className="mt-1 text-sm">
          {s.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, {s.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · {b.durationMin} min
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:items-end">
        <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${active ? "bg-[#E4F2EF] text-[#0B6E5F]" : "bg-black/5 text-black/60"}`}>{label}</span>
        {active && s > new Date() && <p className="text-sm text-black/60">Starts in {until(b.startsAt)}</p>}
        <div className="flex items-center gap-3">
          <Link href={`/booking/${b.id}/confirmed`} className="text-sm underline">{viewer === "client" ? "View Details" : "View Booking"}</Link>
          {active && <JoinConsultationButton bookingId={b.id} status={b.status} startsAt={b.startsAt} endsAt={b.endsAt} />}
          {!active && viewer === "client" && (
            <>
              {label === "Completed" && !b.reviewed && <Link href={`/review/${b.id}`} className="rounded-xl bg-[#0B6E5F] px-3 py-1.5 text-sm text-white">Leave Review</Link>}
              <Link href="/advisors" className="rounded-xl border px-3 py-1.5 text-sm">Book Again</Link>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
