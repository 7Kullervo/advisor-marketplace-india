import crypto from "crypto";
// Server-only. 128-bit random, unguessable, unrelated to booking/advisor/user.
export const createJitsiRoom = () => `advisorhub-${crypto.randomBytes(16).toString("hex")}`;
