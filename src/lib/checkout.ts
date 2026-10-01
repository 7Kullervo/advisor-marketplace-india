"use client";
declare global { interface Window { Razorpay?: any } }
type Result = { ok: true; bookingId: string } | { ok: false; error: string };
const post = (url: string, body: object) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const loadCheckout = () =>
  window.Razorpay ? Promise.resolve() : new Promise<void>((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.onload = () => res(); s.onerror = () => rej(new Error("load"));
    document.body.appendChild(s);
  });

// On success the caller should router.push(`/booking/${bookingId}/confirmed`).
export async function payForBooking(o: { serviceId: string; startsAt: string; name?: string; email?: string }): Promise<Result> {
  const r = await post("/api/payments/create-order", { serviceId: o.serviceId, startsAt: o.startsAt }).catch(() => null);
  if (!r) return { ok: false, error: "Network problem. Please try again." };
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return { ok: false, error: j.error ?? "Could not start payment." };
  try { await loadCheckout(); } catch { return { ok: false, error: "Payment window failed to load." }; }
  return new Promise((resolve) => {
    const rz = new window.Razorpay({
      key: j.keyId, order_id: j.orderId, amount: j.amount, currency: j.currency, name: "AdvisorHub",
      prefill: { name: o.name, email: o.email },
      handler: async (res: any) => {
        const v = await post("/api/payments/verify", { outcome: "success", ...res }).catch(() => null);
        const vj = (await v?.json().catch(() => ({}))) ?? {};
        resolve(v?.ok ? { ok: true, bookingId: vj.bookingId } : { ok: false, error: vj.error ?? "Payment could not be verified." });
      },
      // Closing the popup releases the slot. A failed attempt can be retried inside the popup, so it isn't treated as final.
      modal: { ondismiss: async () => { await post("/api/payments/verify", { outcome: "cancelled", razorpay_order_id: j.orderId }).catch(() => null); resolve({ ok: false, error: "Payment cancelled." }); } },
    });
    rz.open();
  });
}
