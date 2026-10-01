"use client";
import Link from "next/link";
import BookingCard from "@/components/BookingCard";
import { useBookings } from "@/lib/useBookings";

export default function Dashboard() {
  const { loading, error, bookings } = useBookings("client");
  const now = Date.now();
  const upcoming = bookings.filter((b) => b.status === "CONFIRMED" && new Date(b.endsAt).getTime() > now);
  const past = bookings.filter((b) => !upcoming.includes(b)).reverse();
  const list = (items: typeof bookings, empty: string) =>
    items.length ? <div className="space-y-3">{items.map((b) => <BookingCard key={b.id} b={b} viewer="client" />)}</div> : <p className="rounded-3xl bg-white p-6 text-black/60">{empty}</p>;
  return (
    <main className="mx-auto max-w-3xl p-5">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Your consultations</h1>
        <Link href="/dashboard/payments" className="text-sm underline">Payments</Link>
        <Link href="/dashboard/saved" className="text-sm underline">Saved advisors</Link>
        <Link href="/dashboard/settings" className="text-sm underline">Settings</Link>
        <Link href="/become-an-advisor" className="text-sm underline">Become an advisor</Link>
        <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.assign("/"); }} className="text-sm underline">Log out</button>
      </div>
      {loading ? <div className="mt-6 space-y-3">{[0, 1].map((i) => <div key={i} className="h-28 animate-pulse rounded-3xl bg-black/5" />)}</div>
        : error ? <p className="mt-6 rounded-3xl bg-white p-6">{error}</p>
        : <>
            <h2 className="mb-3 mt-8 font-semibold">Upcoming</h2>
            {list(upcoming, "Nothing booked yet.")}
            {!upcoming.length && <Link href="/advisors" className="mt-3 inline-block rounded-xl bg-[#0B6E5F] px-4 py-2 text-white">Find an advisor</Link>}
            <h2 className="mb-3 mt-8 font-semibold">Past</h2>
            {list(past, "No past consultations.")}
          </>}
    </main>
  );
}
