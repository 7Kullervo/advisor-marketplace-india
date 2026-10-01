"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Settings() {
  const [me, setMe] = useState<{ name: string; email: string; role: string } | null>(null);
  const [name, setName] = useState("");
  const [err, setErr] = useState(""); const [ok, setOk] = useState(false); const [busy, setBusy] = useState(false);
  useEffect(() => { fetch("/api/account", { cache: "no-store" }).then((r) => r.json()).then((j) => { setMe(j); setName(j.name ?? ""); }).catch(() => setErr("Network problem.")); }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(""); setOk(false);
    const r = await fetch("/api/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    if (r.ok) setOk(true); else setErr((await r.json().catch(() => ({}))).error ?? "Could not save.");
    setBusy(false);
  }
  if (!me) return <main className="mx-auto max-w-lg p-5"><div className="h-40 animate-pulse rounded-3xl bg-black/5" /></main>;
  return (
    <main className="mx-auto max-w-lg p-5">
      <Link href="/dashboard" className="text-sm underline">← Dashboard</Link>
      <h1 className="mb-6 mt-2 text-3xl font-bold tracking-tight">Settings</h1>
      <form onSubmit={save} className="space-y-3 rounded-3xl bg-white p-6">
        <div><label className="text-xs text-black/50">Email</label><p className="font-medium">{me.email}</p></div>
        <div><label className="text-xs text-black/50">Account type</label><p className="font-medium">{me.role}</p></div>
        <div>
          <label className="text-xs text-black/50" htmlFor="name">Name</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} minLength={2} required className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-[#0B6E5F]" />
        </div>
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
        {ok && <p className="text-sm text-[#0B6E5F]">Saved.</p>}
        <button disabled={busy} className="rounded-xl bg-[#0B6E5F] px-5 py-2.5 font-semibold text-white disabled:opacity-60">{busy ? "…" : "Save"}</button>
      </form>
    </main>
  );
}
