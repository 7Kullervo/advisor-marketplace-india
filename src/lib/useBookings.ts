"use client";
import { useEffect, useState } from "react";
import type { BookingItem } from "@/components/BookingCard";

export function useBookings(as: "client" | "advisor") {
  const [s, setS] = useState<{ loading: boolean; error: string; bookings: BookingItem[]; earningsPaise?: number }>({ loading: true, error: "", bookings: [] });
  useEffect(() => {
    fetch(`/api/bookings?as=${as}`, { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json();
        setS(r.ok ? { loading: false, error: "", bookings: j.bookings, earningsPaise: j.earningsPaise } : { loading: false, error: j.error ?? "Could not load bookings.", bookings: [] });
      })
      .catch(() => setS({ loading: false, error: "Network problem. Please refresh.", bookings: [] }));
  }, [as]);
  return s;
}
