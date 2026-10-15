"use client";

import * as React from "react";
import { useLanguage } from "@/i18n/provider";
import { cn, formatNumber } from "@/lib/utils";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * Live HH:MM:SS for the Today header — inline next to the date (tight, no flex gap).
 */
export function LiveNowClock({ className }: { className?: string }) {
  const language = useLanguage();
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    let intervalId = 0;
    const tick = () => setNow(new Date());
    tick();
    const delay = 1000 - (Date.now() % 1000);
    const timeoutId = window.setTimeout(() => {
      tick();
      intervalId = window.setInterval(tick, 1000);
    }, delay);
    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, []);

  const hours = now ? pad2(now.getHours()) : "--";
  const minutes = now ? pad2(now.getMinutes()) : "--";
  const seconds = now ? pad2(now.getSeconds()) : "--";
  const colonOn = !now || now.getSeconds() % 2 === 0;

  const h = formatNumber(hours, language);
  const m = formatNumber(minutes, language);
  const s = formatNumber(seconds, language);

  return (
    <time
      dateTime={now?.toISOString()}
      aria-live="polite"
      aria-atomic="true"
      // unicode-bidi:isolate so LTR digits stay glued to the date in RTL
      className={cn(
        "inline whitespace-nowrap font-semibold tabular-nums tracking-tight text-foreground [unicode-bidi:isolate]",
        className,
      )}
    >
      <span>{h}</span>
      <span
        className={cn(
          "text-primary",
          "transition-opacity duration-300 motion-reduce:transition-none",
          colonOn ? "opacity-100" : "opacity-30",
        )}
        aria-hidden
      >
        :
      </span>
      <span>{m}</span>
      <span
        className={cn(
          "text-primary",
          "transition-opacity duration-300 motion-reduce:transition-none",
          colonOn ? "opacity-100" : "opacity-30",
        )}
        aria-hidden
      >
        :
      </span>
      <span className="text-primary">{s}</span>
    </time>
  );
}
