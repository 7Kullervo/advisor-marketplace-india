"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type P = { id: string; bookingId: string; status: string; amountPaise: number; createdAt: string; service: string; advisorName: string };

export default function Payments() {
  const [rows, setRows] = useState<P[] | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch("/api/payments/mine", { cache: "no-store" })
      .then(async (r) => { const j = await r.json(); r.ok ? setRows(j.payments) : setErr(j.error ?? "Could not load payments."); })
      .catch(() => setErr("Network problem. Please refresh."));
  }, []);
  return (
    <main className="mx-auto max-w-3xl p-5">
      <Link href="/dashboard" className="text-sm underline">← Dashboard</Link>
      <h1 className="mb-6 mt-2 text-3xl font-bold tracking-tight">Payments</h1>
      {err ? <p className="rounded-3xl bg-white p-6">{err}</p> : !rows ? <div className="h-32 animate-pulse rounded-3xl bg-black/5" />
        : rows.length === 0 ? <p className="rounded-3xl bg-white p-6 text-black/60">No payments yet.</p>
        : <div className="space-y-3">{rows.map((p) => (
            <Link key={p.id} href={`/booking/${p.bookingId}/confirmed`} className="flex items-center justify-between rounded-3xl bg-white p-5">
              <div><p className="font-semibold">{p.service} · {p.advisorName}</p><p className="text-sm text-black/50">{new Date(p.createdAt).toLocaleDateString()} · {p.status}</p></div>
              <p className="font-semibold">₹{(p.amountPaise / 100).toFixed(2)}</p>
            </Link>))}</div>}
    </main>
  );
}
