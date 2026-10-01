import { prisma } from "@/lib/prisma";

// Returns null for "missing" AND "not yours", so callers can't leak which IDs exist.
export async function getAuthorizedBooking(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { user: true, service: true, payment: true, advisor: { include: { user: true } } },
  });
  if (!booking) return null;
  const isClient = booking.userId === userId;
  const isAdvisor = booking.advisor.userId === userId;
  if (!isClient && !isAdvisor) return null;
  return { booking, role: (isClient ? "client" : "advisor") as "client" | "advisor" };
}
