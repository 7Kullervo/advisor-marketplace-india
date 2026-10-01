"use client";
import { useEffect, useRef, useState } from "react";

declare global { interface Window { JitsiMeetExternalAPI?: any } }

type Props = {
  roomName: string; displayName: string; email?: string; bookingId: string;
  userRole: "client" | "advisor"; startsAt?: string; endsAt?: string;
  domain?: string; jwt?: string; scriptSrc?: string; onLeave?: () => void;
};

function loadApi(src: string): Promise<void> {
  if (window.JitsiMeetExternalAPI) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("load"));
    document.head.appendChild(s);
  });
}

// Mount only AFTER /api/bookings/[id]/meeting has authorized the user.
export default function JitsiMeeting(p: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [warn, setWarn] = useState("");
  const domain = p.domain ?? process.env.NEXT_PUBLIC_JITSI_DOMAIN ?? "meet.jit.si";

  useEffect(() => {
    let api: any, dead = false;
    loadApi(p.scriptSrc ?? `https://${domain}/external_api.js`)
      .then(() => {
        if (dead || !box.current) return;
        api = new window.JitsiMeetExternalAPI(domain, {
          roomName: p.roomName, jwt: p.jwt, parentNode: box.current, width: "100%", height: "100%",
          userInfo: { displayName: p.displayName, email: p.email },
          configOverwrite: { disableDeepLinking: true, subject: "Consultation" },
          interfaceConfigOverwrite: { SHOW_JITSI_WATERMARK: false },
        });
        api.addListener("cameraError", () => setWarn("Your camera is blocked. Please allow camera access in your browser settings."));
        api.addListener("micError", () => setWarn("Your microphone is blocked. Please allow microphone access in your browser settings."));
        api.addListener("readyToClose", () => p.onLeave?.());
        setState("ready");
      })
      .catch(() => !dead && setState("error"));
    return () => { dead = true; api?.dispose(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.roomName, domain]);

  return (
    <div className="relative h-full min-h-[420px] w-full overflow-hidden rounded-3xl bg-black">
      <div ref={box} className="h-full w-full" />
      {state === "loading" && <div className="absolute inset-0 grid place-items-center text-white/70">Connecting…</div>}
      {state === "error" && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center text-white">
          Video failed to load. Check your connection and refresh.
        </div>
      )}
      {warn && <div className="absolute inset-x-0 top-0 bg-amber-500 px-4 py-2 text-center text-sm text-black">{warn}</div>}
    </div>
  );
}
