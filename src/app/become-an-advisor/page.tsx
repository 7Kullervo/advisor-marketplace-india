"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type State = { application: { status: string } | null; categories: { slug: string; name: string }[]; role: string };
const MSG: Record<string, string> = { PENDING: "Application received. We'll review it soon.", REVIEW: "Your application is being reviewed.", APPROVED: "You're approved!", REJECTED: "Your last application wasn't approved. You can apply again." };

export default function Become() {
  const [s, setS] = useState<State | null>(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const load = () => fetch("/api/advisor-applications", { cache: "no-store" }).then(async (r) => { if (r.status === 401) setNeedLogin(true); else setS(await r.json()); }).catch(() => setErr("Network problem. Please refresh."));
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await fetch("/api/advisor-applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))) }).catch(() => null);
    if (r?.ok) await load(); else setErr(r ? (await r.json().catch(() => ({}))).error ?? "Something went wrong." : "Network problem. Try again.");
    setBusy(false);
  }
  const f = "w-full rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-[#0B6E5F]";
  const st = s?.application?.status;
  return (
    <main className="mx-auto max-w-xl bg-[#F7F8FA] p-5">
      <h1 className="text-4xl font-extrabold tracking-tight">Share your expertise. Help someone move forward.</h1>
      {needLogin ? <p className="mt-8"><Link href="/login?next=/become-an-advisor" className="rounded-xl bg-[#0B6E5F] px-5 py-3 font-semibold text-white">Log in to apply</Link></p>
        : !s ? <div className="mt-8 h-40 animate-pulse rounded-3xl bg-black/5" />
        : s.role !== "USER" ? <p className="mt-8 rounded-3xl bg-white p-6">Your account is already set up as an {s.role.toLowerCase()}. <Link href="/advisor/dashboard" className="underline">Open dashboard</Link></p>
        : <>
            {st && <p className="mt-6 rounded-2xl bg-white p-4 text-sm"><b>{st}</b> · {MSG[st]}</p>}
            {(!st || st === "REJECTED") && (
              <form onSubmit={submit} className="mt-6 space-y-3 rounded-3xl bg-white p-6">
                <select name="categorySlug" required className={f} defaultValue=""><option value="" disabled>Category</option>{s.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
                <input name="headline" required minLength={10} maxLength={140} placeholder="One-line headline" className={f} />
                <textarea name="bio" required minLength={30} maxLength={1500} rows={4} placeholder="Bio" className={f} />
                <input name="yearsExperience" type="number" min={0} required placeholder="Years of experience" className={f} />
                <input name="languages" required placeholder="Languages (comma separated)" className={f} />
                <input name="priceRupees" type="number" min={100} required placeholder="Price for 30 min (₹)" className={f} />
                <input name="qualifications" placeholder="Qualifications & certifications" className={f} />
                {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
                <button disabled={busy} className="w-full rounded-xl bg-[#0B6E5F] py-3 font-semibold text-white disabled:opacity-60">{busy ? "…" : "Become an Advisor"}</button>
              </form>
            )}
          </>}
      {err && !s && <p className="mt-4 text-sm text-red-600">{err}</p>}
    </main>
  );
}
