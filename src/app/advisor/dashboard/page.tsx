"use client";
import BookingCard from "@/components/BookingCard";
import { useBookings } from "@/lib/useBookings";

export default function AdvisorDashboard() {
  const { loading, error, bookings, earningsPaise } = useBookings("advisor");
  const now = new Date();
  const upcoming = bookings.filter((b) => b.status === "CONFIRMED" && new Date(b.endsAt) > now);
  const today = upcoming.filter((b) => new Date(b.startsAt).toDateString() === now.toDateString());
  const stats: [string, string][] = [
    ["Today", String(today.length)], ["Upcoming", String(upcoming.length)], ["Total earnings", `₹${((earningsPaise ?? 0) / 100).toFixed(0)}`],
  ];
  return (
    <main className="mx-auto max-w-3xl p-5">
      <h1 className="text-3xl font-bold tracking-tight">Advisor dashboard</h1>
      {loading ? <div className="mt-6 h-40 animate-pulse rounded-3xl bg-black/5" />
        : error ? <p className="mt-6 rounded-3xl bg-white p-6">{error}</p>
        : <>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {stats.map(([k, v]) => <div key={k} className="rounded-3xl bg-white p-4"><p className="text-xs text-black/50">{k}</p><p className="text-2xl font-bold">{v}</p></div>)}
            </div>
            <h2 className="mb-3 mt-8 font-semibold">Upcoming consultations</h2>
            {upcoming.length ? <div className="space-y-3">{upcoming.map((b) => <BookingCard key={b.id} b={b} viewer="advisor" />)}</div>
              : <p className="rounded-3xl bg-white p-6 text-black/60">No upcoming bookings.</p>}
          </>}
    </main>
  );
}
