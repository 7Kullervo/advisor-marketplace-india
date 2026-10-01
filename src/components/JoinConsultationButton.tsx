"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { canJoinConsultation, JOIN_EARLY_MINUTES } from "@/lib/joinRules";

type Props = { bookingId: string; status: string; startsAt: string; endsAt: string };

export default function JoinConsultationButton({ bookingId, status, startsAt, endsAt }: Props) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(t); }, []);
  const r = canJoinConsultation({ status, startsAt, endsAt }, now);
  if (r.ok === true) {
  return (
    <Link
      href={`/consultation/${bookingId}`}
      className="inline-block rounded-xl bg-[#0B6E5F] px-5 py-2.5 font-medium text-white hover:bg-[#095a4e]"
    >
      Join Consultation
    </Link>
  );
}

const reason = r.reason;

const msg =
  reason === "too_early"
    ? `Join opens ${JOIN_EARLY_MINUTES} minutes before your consultation.`
    : reason === "ended"
      ? "Consultation ended"
      : reason === "cancelled"
        ? "Cancelled"
        : "Awaiting confirmation";

return <p className="text-sm text-black/60">{msg}</p>;
}
