// Dev-only sample data. Run: npx tsx --env-file=.env prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
const prisma = new PrismaClient();

async function main() {
  const cat = await prisma.category.upsert({ where: { slug: "financial-advising" }, update: {}, create: { slug: "financial-advising", name: "Financial", icon: "₹" } });
  const user = await prisma.user.upsert({ where: { email: "sarah@example.com" }, update: {}, create: { email: "sarah@example.com", name: "Sarah Khan", passwordHash: hashPassword("ChangeMe123!"), role: "ADVISOR" } });
  const adv = await prisma.advisor.upsert({
    where: { slug: "sarah-khan" }, update: {},
    create: { slug: "sarah-khan", userId: user.id, categoryId: cat.id, headline: "Smarter money plans for young professionals.", bio: "Eight years helping first-time investors build budgets and savings.", yearsExperience: 8, languages: ["English", "Hindi"], verified: true, ratingAvg: 4.9, consultationCount: 320 },
  });
  if (!(await prisma.service.count({ where: { advisorId: adv.id } }))) {
    await prisma.service.createMany({ data: [
      { advisorId: adv.id, name: "30-min consultation", durationMin: 30, pricePaise: 50000 },
      { advisorId: adv.id, name: "60-min consultation", durationMin: 60, pricePaise: 90000 },
    ] });
    await prisma.availability.createMany({ data: [1, 2, 3, 4, 5].map((weekday) => ({ advisorId: adv.id, weekday, startMin: 600, endMin: 1020 })) });
  }
}
main().finally(() => prisma.$disconnect());
