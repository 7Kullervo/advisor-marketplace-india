"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function Review() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr("");
    const body = String(new FormData(e.currentTarget).get("body") ?? "");
    const r = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId, rating, body }) }).catch(() => null);
    if (r?.ok) { router.push("/dashboard"); return; }
    if (r?.status === 401) { router.push(`/login?next=/review/${bookingId}`); return; }
    setErr(r ? (await r.json().catch(() => ({}))).error ?? "Something went wrong." : "Network problem. Try again.");
    setBusy(false);
  }
  return (
    <main className="grid min-h-screen place-items-center bg-[#F7F8FA] p-5">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">How was your consultation?</h1>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} role="radio" aria-checked={rating === n} aria-label={`${n} stars`} onClick={() => setRating(n)} className={`text-3xl ${n <= rating ? "text-amber-500" : "text-black/20"}`}>★</button>
          ))}
        </div>
        <textarea name="body" required minLength={5} maxLength={1000} rows={4} placeholder="A few words for others" className="w-full rounded-xl border border-black/10 p-3 outline-none focus:border-[#0B6E5F]" />
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
        <button disabled={busy || !rating} className="w-full rounded-xl bg-[#0B6E5F] py-3 font-semibold text-white disabled:opacity-50">{busy ? "…" : "Submit review"}</button>
      </form>
    </main>
  );
}
