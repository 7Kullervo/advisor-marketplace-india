"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import JitsiMeeting from "@/components/JitsiMeeting";

type Info = {
  bookingId: string; roomName: string; domain: string; jwt?: string; scriptSrc?: string; role: "client" | "advisor"; displayName: string; email: string;
  otherName: string; service: string; durationMin: number; startsAt: string; endsAt: string;
};

export default function ConsultationRoom() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<"loading" | "lobby" | "call" | "ended">("loading");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}/meeting`, { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) { setError(j.error ?? "Something went wrong."); setPhase("lobby"); return; }
        setInfo(j); setPhase("lobby");
      })
      .catch(() => { setError("Network problem. Check your connection and retry."); setPhase("lobby"); });
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, [bookingId]);

  if (phase === "loading") return <main className="grid min-h-screen place-items-center">Loading…</main>;
  if (error || !info)
    return (
      <main className="grid min-h-screen place-items-center p-6 text-center">
        <div><p className="text-lg font-semibold">{error}</p><Link href="/dashboard" className="mt-4 inline-block text-[#0B6E5F] underline">Back to dashboard</Link></div>
      </main>
    );

  const start = new Date(info.startsAt), end = new Date(info.endsAt);
  const minsLeft = Math.max(0, Math.round((end.getTime() - now) / 60_000));
  const when = `${start.toLocaleDateString(undefined, { month: "long", day: "numeric" })}, ${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;

  if (phase === "ended")
    return (
      <main className="grid min-h-screen place-items-center bg-[#F7F8FA] p-6 text-center">
        <div>
          <h1 className="text-3xl font-bold">Consultation ended</h1>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard" className="rounded-xl border px-4 py-2">Back to dashboard</Link>
            {info.role === "client" && <Link href={`/review/${info.bookingId}`} className="rounded-xl border px-4 py-2">Leave a review</Link>}
            <Link href="/advisors" className="rounded-xl bg-[#0B6E5F] px-4 py-2 text-white">Book another consultation</Link>
          </div>
        </div>
      </main>
    );

  const details = (
    <dl className="space-y-3 text-sm">
      <div><dt className="text-black/50">{info.role === "client" ? "Advisor" : "Client"}</dt><dd className="font-medium">{info.otherName}</dd></div>
      <div><dt className="text-black/50">Session</dt><dd className="font-medium">{info.service} · {info.durationMin} min</dd></div>
      <div><dt className="text-black/50">Time left</dt><dd className="font-medium">{minsLeft} min</dd></div>
      <div><dt className="text-black/50">Booking ID</dt><dd className="font-mono text-xs">{info.bookingId}</dd></div>
      <a href={`mailto:support@example.com?subject=Issue with booking ${info.bookingId}`} className="text-[#0B6E5F] underline">Report an issue</a>
    </dl>
  );

  return (
    <main className="flex min-h-screen flex-col bg-[#F7F8FA] p-3 md:p-5">
      <header className="mb-3 flex flex-wrap items-baseline gap-x-4">
        <h1 className="text-lg font-bold">{info.service}</h1>
        <p className="text-sm text-black/60">{when} · Confirmed</p>
      </header>
      {phase === "lobby" ? (
        <div className="grid flex-1 place-items-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#0B6E5F] text-xl font-bold text-white">{info.otherName.split(" ").map((w) => w[0]).join("")}</div>
            <h2 className="mt-4 text-2xl font-bold">Your consultation is ready</h2>
            <p className="mt-1 text-black/60">{info.otherName} · {info.service}</p>
            <p className="text-black/60">{when}</p>
            <button onClick={() => setPhase("call")} className="mt-6 w-full rounded-xl bg-[#0B6E5F] py-3 font-semibold text-white hover:bg-[#095a4e]">Enter Consultation</button>
          </div>
        </div>
      ) : (
        <div className="grid flex-1 gap-4 lg:grid-cols-[1fr_300px]">
          <div className="h-[75vh] min-h-[420px] lg:h-auto">
            <JitsiMeeting roomName={info.roomName} domain={info.domain} jwt={info.jwt} scriptSrc={info.scriptSrc} displayName={info.displayName} email={info.email}
              bookingId={info.bookingId} userRole={info.role} startsAt={info.startsAt} endsAt={info.endsAt} onLeave={() => setPhase("ended")} />
          </div>
          <aside className="hidden rounded-3xl bg-white p-5 lg:block">{details}</aside>
          <details className="rounded-2xl bg-white p-4 lg:hidden"><summary className="cursor-pointer font-medium">Consultation details</summary><div className="mt-3">{details}</div></details>
        </div>
      )}
    </main>
  );
}
