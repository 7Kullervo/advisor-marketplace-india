import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  const u = await getSessionUser(req);
  if (!u) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  if (u.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const apps = await prisma.advisorApplication.findMany({ where: { status: { in: ["PENDING", "REVIEW"] } }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ applications: apps }, { headers: { "Cache-Control": "no-store" } });
}
