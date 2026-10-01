import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSlots } from "@/lib/slots";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const q = new URL(req.url).searchParams;
  const service = await prisma.service.findFirst({ where: { id: q.get("serviceId") ?? "", active: true, advisor: { slug, verified: true } } });
  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const slots = await getSlots(service.advisorId, service.durationMin, q.get("date") ?? "");
  return NextResponse.json({ slots: slots.map((d) => d.toISOString()) }, { headers: { "Cache-Control": "no-store" } });
}
