import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { localDate } from "@/lib/slots";
import BookingPicker from "@/components/BookingPicker";
import SaveAdvisorButton from "@/components/SaveAdvisorButton";

const get = (slug: string) =>
  prisma.advisor.findFirst({
    where: { slug, verified: true },
    include: { user: true, category: true, services: { where: { active: true }, orderBy: { pricePaise: "asc" } } },
  });

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await get((await params).slug);
  if (!a) return {};
  const title = `${a.user.name} · ${a.category.name} Advisor`;
  return { title, description: a.headline, openGraph: { title, description: a.headline } };
}

export default async function AdvisorProfile({ params }: { params: Promise<{ slug: string }> }) {
  const a = await get((await params).slug);
  if (!a) notFound();
  const dates = Array.from({ length: 14 }, (_, i) => localDate(new Date(Date.now() + i * 864e5)));
  const tz = process.env.PLATFORM_TIMEZONE ?? "Asia/Kolkata";
  return (
    <main className="mx-auto grid max-w-6xl gap-8 bg-[#F7F8FA] p-5 lg:grid-cols-[1fr_400px]">
      <section>
        <div className="flex items-center gap-4">
          <div className="grid h-24 w-24 place-items-center rounded-3xl bg-[#0B6E5F] text-3xl font-bold text-white">{a.user.name.split(" ").map((w) => w[0]).join("")}</div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{a.user.name} <span className="text-base font-medium text-[#0B6E5F]">✓ Verified</span></h1>
            <p className="text-black/60">{a.category.name} Advisor</p>
            <p className="mt-1 text-sm text-black/60">★ {a.ratingAvg.toFixed(1)} · {a.consultationCount}+ consultations · {a.yearsExperience} yrs · {a.languages.join(", ")}</p>
            <div className="mt-2"><SaveAdvisorButton slug={a.slug} /></div>
          </div>
        </div>
        <p className="mt-6 text-lg font-medium">{a.headline}</p>
        <h2 className="mb-2 mt-8 font-semibold">About</h2>
        <p className="text-black/70">{a.bio}</p>
      </section>
      <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm lg:sticky lg:top-20">
        <h2 className="mb-4 text-lg font-bold">Book a consultation</h2>
        <BookingPicker slug={a.slug} tz={tz} dates={dates} services={a.services.map((s) => ({ id: s.id, name: s.name, durationMin: s.durationMin, pricePaise: s.pricePaise }))} />
      </aside>
    </main>
  );
}
