import Link from "next/link";

const categories = [
  ["Financial", "financial-advising", "₹"], ["Career", "career", "↗"], ["Business", "business", "▣"],
  ["Investment", "investment", "△"], ["Education", "education", "✎"], ["Legal", "legal", "⚖"],
  ["Health & Wellness", "health", "♡"], ["Technology", "technology", "⌘"], ["Marketing", "marketing", "◎"],
  ["Life Coaching", "life", "☾"],
] as const;

const advisors = [
  { slug: "sarah-khan", name: "Sarah Khan", role: "Financial Advisor", line: "Smarter money plans for young professionals.", rating: 4.9, n: 320, yrs: 8, price: 30, mins: 30 },
  { slug: "arjun-mehta", name: "Arjun Mehta", role: "Career Advisor", line: "Land the role, negotiate the offer.", rating: 4.8, n: 210, yrs: 11, price: 25, mins: 30 },
  { slug: "priya-nair", name: "Priya Nair", role: "Tax Advisor", line: "Filing made calm, savings made clear.", rating: 4.9, n: 450, yrs: 14, price: 35, mins: 30 },
  { slug: "omar-siddiqui", name: "Omar Siddiqui", role: "Business Advisor", line: "From first customers to first hires.", rating: 4.7, n: 180, yrs: 12, price: 45, mins: 60 },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F7F8FA] text-[#151A22]">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3 text-sm">
          <Link href="/" className="text-lg font-bold tracking-tight text-[#0B6E5F]">counsel</Link>
          <div className="ml-4 hidden gap-5 md:flex">
            <Link href="/advisors">Find an advisor</Link><Link href="/#how">How it works</Link><Link href="/become-an-advisor">Become an advisor</Link>
          </div>
          <div className="ml-auto flex gap-2">
            <Link href="/login" className="rounded-full px-4 py-2 hover:bg-black/5">Log in</Link>
            <Link href="/signup" className="rounded-full bg-[#0B6E5F] px-4 py-2 font-medium text-white transition hover:bg-[#095a4e]">Sign up</Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-10 pt-16 md:pt-24">
        <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl">Expert advice, when you need it.</h1>
        <p className="mt-4 text-lg text-black/60">Trusted advisors, one call away.</p>
        <form action="/advisors" className="mt-8 flex max-w-2xl flex-col gap-2 rounded-3xl bg-white p-2 shadow-[0_8px_30px_rgba(20,26,34,.08)] sm:flex-row">
          <input name="q" placeholder="Advisor, skill, or problem" className="flex-1 rounded-2xl px-4 py-3 outline-none" />
          <button className="rounded-2xl bg-[#0B6E5F] px-6 py-3 font-semibold text-white transition hover:bg-[#095a4e]">Find an advisor</button>
        </form>
      </section>

      <section className="mx-auto max-w-6xl px-5">
        <div className="flex gap-3 overflow-x-auto pb-3">
          {categories.map(([name, slug, icon]) => (
            <Link key={slug} href={`/advisors/${slug}`} className="flex min-w-[112px] flex-col items-center gap-2 rounded-3xl bg-white px-4 py-4 text-center text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#E4F2EF] text-lg text-[#0B6E5F]">{icon}</span>{name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="mb-5 text-2xl font-bold tracking-tight">Featured advisors</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {advisors.map((a) => (
            <article key={a.slug} className="flex flex-col rounded-3xl bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#0B6E5F] text-lg font-bold text-white">{a.name.split(" ").map((w) => w[0]).join("")}</div>
                <div>
                  <p className="font-semibold">{a.name}</p>
                  <p className="text-xs font-medium text-[#0B6E5F]">✓ Verified</p>
                </div>
              </div>
              <p className="mt-3 text-sm font-medium">{a.role}</p>
              <p className="mt-1 flex-1 text-sm text-black/60">{a.line}</p>
              <p className="mt-3 text-xs text-black/60">★ {a.rating} · {a.n}+ consultations · {a.yrs} yrs</p>
              <p className="mt-2 font-semibold">${a.price} <span className="text-xs font-normal text-black/50">/ {a.mins} min</span></p>
              <div className="mt-4 flex gap-2">
                <Link href={`/advisor/${a.slug}`} className="flex-1 rounded-xl border border-black/10 py-2 text-center text-sm hover:bg-black/5">View profile</Link>
                <Link href={`/advisor/${a.slug}/book`} className="flex-1 rounded-xl bg-[#0B6E5F] py-2 text-center text-sm font-medium text-white hover:bg-[#095a4e]">Book now</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-5 pb-20">
        <ol className="grid gap-4 sm:grid-cols-4">
          {["Choose an advisor", "Select a time", "Pay securely", "Meet your advisor"].map((s, i) => (
            <li key={s} className="rounded-3xl bg-white p-5 font-semibold"><span className="mb-3 block text-sm text-[#0B6E5F]">{i + 1}</span>{s}</li>
          ))}
        </ol>
      </section>
    </main>
  );
}
