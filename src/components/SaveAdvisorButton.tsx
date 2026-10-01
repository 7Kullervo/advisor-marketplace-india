"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SaveAdvisorButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState<boolean | null>(null);
  async function toggle() {
    const r = await fetch("/api/saved-advisors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ advisorSlug: slug }) });
    if (r.status === 401) { router.push(`/login?next=/advisor/${slug}`); return; }
    const j = await r.json().catch(() => ({}));
    setSaved(!!j.saved);
  }
  return (
    <button onClick={toggle} className="rounded-xl border border-black/10 px-3 py-1.5 text-sm hover:bg-black/5">
      {saved ? "♥ Saved" : "♡ Save"}
    </button>
  );
}
