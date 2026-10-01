"use client";

import * as React from "react";
import { PRESENCE_HEARTBEAT_MS } from "@/lib/presence";

/** Pings /api/presence/heartbeat while the dashboard tab is visible. */
export function PresenceBeacon() {
  React.useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const beat = () => {
      if (cancelled || document.visibilityState !== "visible") return;
      void fetch("/api/presence/heartbeat", {
        method: "POST",
        credentials: "same-origin",
        keepalive: true,
      }).catch(() => {});
    };

    beat();
    timer = setInterval(beat, PRESENCE_HEARTBEAT_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") beat();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
