"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type S = { advisorSlug: string; name: string; category: string; headline: string; rating: number };

export default function Saved() {
  const [rows, setRows] = useState<S[] | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch("/api/saved-advisors", { cache: "no-store" })
      .then(async (r) => { const j = await r.json(); r.ok ? setRows(j.saved) : setErr(j.error ?? "Could not load."); })
      .catch(() => setErr("Network problem. Please refresh."));
  }, []);
  return (
    <main className="mx-auto max-w-3xl p-5">
      <Link href="/dashboard" className="text-sm underline">← Dashboard</Link>
      <h1 className="mb-6 mt-2 text-3xl font-bold tracking-tight">Saved advisors</h1>
      {err ? <p className="rounded-3xl bg-white p-6">{err}</p> : !rows ? <div className="h-32 animate-pulse rounded-3xl bg-black/5" />
        : rows.length === 0 ? <p className="rounded-3xl bg-white p-6 text-black/60">No saved advisors yet.</p>
        : <div className="grid gap-3 sm:grid-cols-2">{rows.map((s) => (
            <Link key={s.advisorSlug} href={`/advisor/${s.advisorSlug}`} className="rounded-3xl bg-white p-5 hover:shadow-md">
              <p className="font-semibold">{s.name}</p><p className="text-sm text-black/60">{s.category}</p>
              <p className="mt-1 text-sm text-black/60">{s.headline}</p><p className="mt-2 text-xs text-black/50">★ {s.rating.toFixed(1)}</p>
            </Link>))}</div>}
    </main>
  );
}
