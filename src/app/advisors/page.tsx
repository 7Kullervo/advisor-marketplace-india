import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { localDate } from "@/lib/slots";

export const metadata = { title: "Find an advisor" };
type SP = { q?: string; category?: string; sort?: string; maxPrice?: string; minRating?: string; language?: string; duration?: string; today?: string };
const num = (v?: string) => (v && !Number.isNaN(Number(v)) ? Number(v) : undefined);

export default async function Advisors({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const maxP = num(sp.maxPrice), minR = num(sp.minRating), dur = num(sp.duration);
  const ci = { contains: sp.q ?? "", mode: "insensitive" as const };
  const weekday = new Date(`${localDate(new Date())}T00:00:00Z`).getUTCDay();
  const orderBy = sp.sort === "experience" ? [{ yearsExperience: "desc" as const }] : sp.sort === "consulted" ? [{ consultationCount: "desc" as const }] : [{ ratingAvg: "desc" as const }, { consultationCount: "desc" as const }];
  const [cats, raw] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.advisor.findMany({
      where: {
        verified: true,
        ...(sp.category ? { category: { slug: sp.category } } : {}),
        ...(minR ? { ratingAvg: { gte: minR } } : {}),
        ...(sp.language ? { languages: { has: sp.language } } : {}),
        ...(sp.today ? { availability: { some: { weekday } } } : {}),
        ...(maxP || dur ? { services: { some: { active: true, ...(maxP ? { pricePaise: { lte: maxP * 100 } } : {}), ...(dur ? { durationMin: dur } : {}) } } } : {}),
        ...(sp.q ? { OR: [{ headline: ci }, { user: { name: ci } }, { expertise: { some: { name: ci } } }] } : {}),
      },
      include: { user: true, category: true, services: { where: { active: true }, select: { pricePaise: true } } },
      orderBy, take: 48,
    }),
  ]);
  const min = (a: (typeof raw)[number]) => (a.services.length ? Math.min(...a.services.map((s) => s.pricePaise)) : Infinity);
  const list = sp.sort === "price" ? [...raw].sort((a, b) => min(a) - min(b)) : raw;
  const sel = "rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-black/10";
  return (
    <main className="mx-auto max-w-6xl bg-[#F7F8FA] p-5">
      <h1 className="text-4xl font-extrabold tracking-tight">Find the right advisor</h1>
      <form className="mt-5 space-y-3">
        {sp.category && <input type="hidden" name="category" value={sp.category} />}
        <div className="flex max-w-xl gap-2 rounded-3xl bg-white p-2 shadow-sm">
          <input name="q" defaultValue={sp.q} placeholder="Advisor, skill, or problem" className="flex-1 rounded-2xl px-4 py-2 outline-none" />
          <button className="rounded-2xl bg-[#0B6E5F] px-5 py-2 font-medium text-white">Search</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select name="sort" defaultValue={sp.sort ?? ""} className={sel}><option value="">Recommended</option><option value="rating">Rating</option><option value="price">Price: low to high</option><option value="experience">Experience</option><option value="consulted">Most consulted</option></select>
          <select name="maxPrice" defaultValue={sp.maxPrice ?? ""} className={sel}><option value="">Any price</option><option value="500">Up to ₹500</option><option value="1000">Up to ₹1000</option><option value="2000">Up to ₹2000</option></select>
          <select name="minRating" defaultValue={sp.minRating ?? ""} className={sel}><option value="">Any rating</option><option value="4">4.0+</option><option value="4.5">4.5+</option></select>
          <select name="duration" defaultValue={sp.duration ?? ""} className={sel}><option value="">Any length</option><option value="30">30 min</option><option value="60">60 min</option></select>
          <select name="language" defaultValue={sp.language ?? ""} className={sel}><option value="">Any language</option><option>English</option><option>Hindi</option><option>Urdu</option></select>
          <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="today" value="1" defaultChecked={!!sp.today} /> Works today</label>
          <button className="rounded-xl border px-3 py-2 text-sm">Apply</button>
        </div>
      </form>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {[{ slug: "", name: "All" }, ...cats].map((c) => (
          <Link key={c.slug} href={c.slug ? `/advisors?category=${c.slug}` : "/advisors"} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm ${(sp.category ?? "") === c.slug ? "bg-[#0B6E5F] text-white" : "bg-white ring-1 ring-black/10"}`}>{c.name}</Link>
        ))}
      </div>
      {list.length === 0 ? <p className="mt-10 rounded-3xl bg-white p-8 text-center text-black/60">No advisors match. Try loosening a filter.</p> : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((a) => (
            <Link key={a.id} href={`/advisor/${a.slug}`} className="flex flex-col rounded-3xl bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#0B6E5F] font-bold text-white">{a.user.name.split(" ").map((w) => w[0]).join("")}</div>
              <p className="mt-3 font-semibold">{a.user.name} <span className="text-xs text-[#0B6E5F]">✓</span></p>
              <p className="text-sm text-black/60">{a.category.name} · {a.yearsExperience} yrs</p>
              <p className="mt-1 flex-1 text-sm text-black/60">{a.headline}</p>
              <p className="mt-3 text-xs text-black/60">★ {a.ratingAvg.toFixed(1)} · {a.consultationCount}+ consultations</p>
              {min(a) !== Infinity && <p className="mt-1 font-semibold">from ₹{(min(a) / 100).toFixed(0)}</p>}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
