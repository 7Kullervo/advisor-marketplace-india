"use client";
import Link from "next/link";
import { useState } from "react";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr("");
    const body = Object.fromEntries(new FormData(e.currentTarget));
    const r = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    if (r?.ok) {
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.assign(next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
      return;
    }
    setErr(r ? (await r.json().catch(() => ({}))).error ?? "Something went wrong." : "Network problem. Try again.");
    setBusy(false);
  }
  const f = "w-full rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-[#0B6E5F]";
  return (
    <main className="grid min-h-screen place-items-center bg-[#F7F8FA] p-5">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        {mode === "signup" && <input name="name" placeholder="Full name" required className={f} />}
        <input name="email" type="email" placeholder="Email" required className={f} />
        <input name="password" type="password" placeholder="Password" required minLength={mode === "signup" ? 8 : 1} className={f} />
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-[#0B6E5F] py-3 font-semibold text-white disabled:opacity-60">{busy ? "…" : mode === "login" ? "Log in" : "Sign up"}</button>
        <p className="text-center text-sm text-black/60">
          {mode === "login" ? <>New here? <Link href="/signup" className="underline">Sign up</Link></> : <>Have an account? <Link href="/login" className="underline">Log in</Link></>}
        </p>
      </form>
    </main>
  );
}
