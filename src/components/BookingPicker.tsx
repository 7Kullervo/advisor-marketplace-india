"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { payForBooking } from "@/lib/checkout";

type Svc = { id: string; name: string; durationMin: number; pricePaise: number };
const inr = (p: number) => `₹${(p / 100).toFixed(0)}`;

export default function BookingPicker({ slug, services, dates, tz }: { slug: string; services: Svc[]; dates: string[]; tz: string }) {
  const router = useRouter();
  const [sid, setSid] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState(dates[0]);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [pick, setPick] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!sid) return;
    setSlots(null); setPick("");
    const ac = new AbortController();
    fetch(`/api/advisors/${slug}/slots?serviceId=${sid}&date=${date}`, { signal: ac.signal })
      .then((r) => r.json()).then((j) => setSlots(j.slots ?? []))
      .catch((e) => { if (e.name !== "AbortError") { setSlots([]); setErr("Couldn't load times. Try again."); } });
    return () => ac.abort();
  }, [sid, date, slug, tick]);

  async function book() {
    setBusy(true); setErr("");
    const r = await payForBooking({ serviceId: sid, startsAt: pick });
    if (r.ok === true) {
  router.push(`/booking/${r.bookingId}/confirmed`);
  return;
}

if (r.ok === false && r.error === "Unauthorized") {
  router.push(`/login?next=${encodeURIComponent(`/advisor/${slug}`)}`);
  return;
}

if (r.ok === false) {
  setErr(r.error);
  setBusy(false);
  setTick((t) => t + 1);
}
  }
  const svc = services.find((s) => s.id === sid);
  if (!services.length) return <p className="text-black/60">No services available right now.</p>;
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        {services.map((s) => (
          <button key={s.id} onClick={() => setSid(s.id)} className={`flex w-full justify-between rounded-2xl border px-4 py-3 text-left transition ${s.id === sid ? "border-[#0B6E5F] bg-[#E4F2EF]" : "border-black/10 hover:bg-black/5"}`}>
            <span className="font-medium">{s.name} <span className="text-sm font-normal text-black/50">· {s.durationMin} min</span></span><span className="font-semibold">{inr(s.pricePaise)}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {dates.map((d) => (
          <button key={d} onClick={() => setDate(d)} className={`min-w-[64px] rounded-2xl px-3 py-2 text-center text-sm ${d === date ? "bg-[#0B6E5F] text-white" : "bg-white ring-1 ring-black/10"}`}>
            {new Date(`${d}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", timeZone: "UTC" })}
          </button>
        ))}
      </div>
      {slots === null ? <div className="h-20 animate-pulse rounded-2xl bg-black/5" />
        : slots.length === 0 ? <p className="text-sm text-black/60">No times left on this day. Try another date.</p>
        : <div className="grid grid-cols-3 gap-2">
            {slots.map((s) => (
              <button key={s} onClick={() => setPick(s)} className={`rounded-xl py-2 text-sm ${s === pick ? "bg-[#0B6E5F] text-white" : "ring-1 ring-black/10 hover:bg-black/5"}`}>
                {new Date(s).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZone: tz })}
              </button>
            ))}
          </div>}
      <p className="text-xs text-black/50">Times in {tz}. Platform fee added at checkout.</p>
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
      <div className="sticky bottom-3">
        <button disabled={!pick || busy} onClick={book} className="w-full rounded-xl bg-[#0B6E5F] py-3 font-semibold text-white shadow-lg disabled:opacity-50">
          {busy ? "Opening payment…" : pick ? `Continue to payment · ${inr(svc!.pricePaise)}` : "Select a time"}
        </button>
      </div>
    </div>
  );
}
