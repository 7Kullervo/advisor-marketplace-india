"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import JoinConsultationButton from "@/components/JoinConsultationButton";

type B = { id: string; status: string; role: string; startsAt: string; endsAt: string; service: string; durationMin: number; otherName: string; amountPaise: number | null };
const g = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export default function Confirmed() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [b, setB] = useState<B | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch(`/api/bookings/${bookingId}`, { cache: "no-store" })
      .then(async (r) => { const j = await r.json(); r.ok ? setB(j) : setErr(j.error ?? "Booking not found."); })
      .catch(() => setErr("Network problem. Please refresh."));
  }, [bookingId]);

  if (err) return <main className="grid min-h-screen place-items-center p-6 text-center"><div><p className="font-semibold">{err}</p><Link href="/dashboard" className="mt-3 inline-block underline">Go to dashboard</Link></div></main>;
  if (!b) return <main className="grid min-h-screen place-items-center"><div className="h-40 w-full max-w-md animate-pulse rounded-3xl bg-black/5" /></main>;

  const s = new Date(b.startsAt);
  const confirmed = b.status === "CONFIRMED";
  const url = `${window.location.origin}/consultation/${b.id}`;
  const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${b.service} with ${b.otherName}`)}&dates=${g(b.startsAt)}/${g(b.endsAt)}&details=${encodeURIComponent(`Join: ${url}`)}`;
  const rows: [string, string][] = [
    [b.role === "client" ? "Advisor" : "Client", b.otherName],
    ["Date", s.toLocaleDateString(undefined, { month: "long", day: "numeric" })],
    ["Time", s.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })],
    ["Duration", `${b.durationMin} minutes`],
    ...(b.amountPaise != null ? [["Paid", `₹${(b.amountPaise / 100).toFixed(2)}`] as [string, string]] : []),
    ["Booking ID", b.id],
  ];
  return (
    <main className="grid min-h-screen place-items-center bg-[#F7F8FA] p-5">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <div className="mx-auto grid h-14 w-14 animate-[pulse_1s_ease-out_1] place-items-center rounded-full bg-[#E4F2EF] text-2xl text-[#0B6E5F]">✓</div>
        <h1 className="mt-4 text-center text-2xl font-bold">{confirmed ? "Consultation booked!" : "Booking " + b.status.toLowerCase()}</h1>
        {confirmed && <p className="mt-1 text-center text-sm text-[#0B6E5F]">✓ Payment successful · ✓ Booking confirmed</p>}
        <dl className="mt-6 space-y-2 text-sm">
          {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-black/50">{k}</dt><dd className="break-all text-right font-medium">{v}</dd></div>)}
        </dl>
        {confirmed && (
          <div className="mt-6 flex flex-col gap-3">
            <div className="flex justify-center"><JoinConsultationButton bookingId={b.id} status={b.status} startsAt={b.startsAt} endsAt={b.endsAt} /></div>
            <a href={gcal} target="_blank" rel="noreferrer" className="rounded-xl border py-2 text-center text-sm">Add to Google Calendar</a>
            <a href={`/api/bookings/${b.id}/ics`} className="rounded-xl border py-2 text-center text-sm">Download Calendar Event</a>
          </div>
        )}
        <Link href="/dashboard" className="mt-4 block text-center text-sm underline">Go to dashboard</Link>
      </section>
    </main>
  );
}
