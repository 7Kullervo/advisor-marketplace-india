"use client";
import { useEffect, useState } from "react";

type A = { id: string; name: string; email: string; categorySlug: string; status: string; data: { headline: string; bio: string; yearsExperience: number; languages: string[]; pricePaise: number; qualifications?: string } };

export default function Admin() {
  const [apps, setApps] = useState<A[] | null>(null);
  const [err, setErr] = useState("");
  const load = () => fetch("/api/admin/applications", { cache: "no-store" })
    .then(async (r) => { const j = await r.json(); r.ok ? setApps(j.applications) : setErr(r.status === 403 ? "Admins only." : j.error ?? "Could not load."); })
    .catch(() => setErr("Network problem. Please refresh."));
  useEffect(() => { load(); }, []);
  async function act(id: string, action: string) {
    if (action === "reject" && !confirm("Reject this application?")) return;
    const r = await fetch(`/api/admin/applications/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    if (!r.ok) setErr((await r.json().catch(() => ({}))).error ?? "Action failed."); else { setErr(""); load(); }
  }
  return (
    <main className="mx-auto max-w-3xl p-5">
      <h1 className="text-3xl font-bold tracking-tight">Advisor applications</h1>
      {err && <p role="alert" className="mt-4 rounded-2xl bg-white p-4 text-red-600">{err}</p>}
      {!apps && !err ? <div className="mt-6 h-32 animate-pulse rounded-3xl bg-black/5" /> : apps?.length === 0 ? <p className="mt-6 rounded-3xl bg-white p-6 text-black/60">Nothing to review.</p> : (
        <div className="mt-6 space-y-3">
          {apps?.map((a) => (
            <article key={a.id} className="rounded-3xl bg-white p-5">
              <p className="font-semibold">{a.name} <span className="text-sm font-normal text-black/50">· {a.email} · {a.categorySlug} · {a.status}</span></p>
              <p className="mt-1 text-sm">{a.data.headline}</p>
              <p className="mt-1 text-sm text-black/60">{a.data.bio}</p>
              <p className="mt-1 text-xs text-black/50">{a.data.yearsExperience} yrs · {a.data.languages.join(", ")} · ₹{a.data.pricePaise / 100}/30 min{a.data.qualifications ? ` · ${a.data.qualifications}` : ""}</p>
              <div className="mt-3 flex gap-2">
                {a.status === "PENDING" && <button onClick={() => act(a.id, "review")} className="rounded-xl border px-3 py-1.5 text-sm">Start review</button>}
                <button onClick={() => act(a.id, "approve")} className="rounded-xl bg-[#0B6E5F] px-3 py-1.5 text-sm text-white">Approve</button>
                <button onClick={() => act(a.id, "reject")} className="rounded-xl border px-3 py-1.5 text-sm text-red-600">Reject</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
