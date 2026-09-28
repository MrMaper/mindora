"use client";

import * as React from "react";
import { useTranslation } from "@/i18n/provider";
import { pollTimedRemindersAction } from "@/features/life/reminder-poll";

/**
 * While the member shell is open, poll for upcoming timed dues and
 * surface OS notifications when permission is granted.
 */
export function ReminderWatcher() {
  const t = useTranslation();
  const asked = React.useRef(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default" && !asked.current) {
      asked.current = true;
      // Soft ask once per session — user can also enable in settings later
      void Notification.requestPermission();
    }

    let cancelled = false;

    async function tick() {
      try {
        const result = await pollTimedRemindersAction();
        if (cancelled || !result.success || !result.data?.length) return;
        if (Notification.permission !== "granted") return;
        for (const item of result.data) {
          const n = new Notification(item.title, {
            body: item.body,
            tag: item.tag,
            data: { href: item.href },
          });
          n.onclick = () => {
            window.focus();
            if (item.href) window.location.href = item.href;
            n.close();
          };
        }
      } catch {
        // ignore poll errors
      }
    }

    void tick();
    const id = window.setInterval(tick, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [t]);

  return null;
}
