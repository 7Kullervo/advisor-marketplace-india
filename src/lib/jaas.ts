import crypto from "crypto";
// Server-only. Signs a per-user, per-room JWT for Jitsi as a Service.
const b64 = (x: object | Buffer) => Buffer.from(x instanceof Buffer ? x : JSON.stringify(x)).toString("base64url");
export const jaasEnabled = () => !!(process.env.JAAS_APP_ID && process.env.JAAS_KEY_ID && process.env.JAAS_PRIVATE_KEY);

export function jaasToken(o: { room: string; name: string; email: string; userId: string; moderator: boolean; endsAt: Date }) {
  const appId = process.env.JAAS_APP_ID!;
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT", kid: `${appId}/${process.env.JAAS_KEY_ID}` };
  const payload = {
    aud: "jitsi", iss: "chat", sub: appId, room: o.room, nbf: now - 10,
    exp: Math.floor(o.endsAt.getTime() / 1000) + 900,
    context: { user: { id: o.userId, name: o.name, email: o.email, moderator: String(o.moderator) }, features: {} },
  };
  const data = `${b64(header)}.${b64(payload)}`;
  const sig = crypto.createSign("RSA-SHA256").update(data).sign(process.env.JAAS_PRIVATE_KEY!.replace(/\\n/g, "\n"));
  return `${data}.${b64(sig)}`;
}
