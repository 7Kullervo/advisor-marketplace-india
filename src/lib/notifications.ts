import { prisma } from "@/lib/prisma";

export type Channel = "email" | "sms" | "whatsapp";
export type Recipient = { email: string; name: string };
export interface NotificationProvider { channel: Channel; send(to: Recipient, subject: string, body: string): Promise<void> }

// Dev default just logs. Register Resend/SES/Twilio providers here; callers don't change.
const consoleEmail: NotificationProvider = { channel: "email", async send(to, subject, body) { console.log(`[email -> ${to.email}] ${subject}\n${body}`); } };
const providers: NotificationProvider[] = [consoleEmail];
export const registerProvider = (p: NotificationProvider) => providers.push(p);

export type NotifyData = { bookingId: string; service?: string; startsAt?: string; url?: string };
const T: Record<string, (d: NotifyData) => [string, string]> = {
  booking_confirmed: (d) => ["Your consultation is booked", `Your ${d.service} is confirmed for ${d.startsAt}. Join: ${d.url}`],
  reminder_24h: (d) => ["Your consultation is tomorrow", `${d.service} starts at ${d.startsAt}. Join: ${d.url}`],
  reminder_15m: (d) => ["Starting in 15 minutes", `${d.service} is about to start. Join: ${d.url}`],
};

export async function notify(userId: string, template: string, data: NotifyData) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
  const tpl = T[template];
  if (!user || !tpl) return;
  const [subject, body] = tpl(data);
  for (const p of providers) {
    const row = await prisma.notification.create({ data: { userId, channel: p.channel, template, payload: JSON.parse(JSON.stringify(data)) } });
    try {
      await p.send(user, subject, body);
      await prisma.notification.update({ where: { id: row.id }, data: { sentAt: new Date() } });
    } catch (e) { console.error("notify failed", template, e); }
  }
}
