"use client";

import * as React from "react";
import { cn, formatNumber } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const ITEM_H = 36;
/** Ignore further wheel steps briefly so one mouse notch = one value. */
const WHEEL_COOLDOWN_MS = 55;
/** Snap + commit after finger/trackpad scrolling settles. */
const SCROLL_SETTLE_MS = 90;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function nearestIndex(values: number[], value: number): number {
  const exact = values.indexOf(value);
  if (exact >= 0) return exact;
  let best = 0;
  for (let i = 1; i < values.length; i++) {
    if (Math.abs(values[i]! - value) < Math.abs(values[best]! - value)) {
      best = i;
    }
  }
  return best;
}

function WheelColumn({
  values,
  value,
  onChange,
  label,
}: {
  values: number[];
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  const listRef = React.useRef<HTMLDivElement>(null);
  const syncingRef = React.useRef(false);
  const settlingRef = React.useRef(false);
  const wheelLockRef = React.useRef(false);
  const settleTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const valueRef = React.useRef(value);
  const valuesRef = React.useRef(values);
  const onChangeRef = React.useRef(onChange);
  valueRef.current = value;
  valuesRef.current = values;
  onChangeRef.current = onChange;

  const scrollToIndex = React.useCallback((index: number, smooth: boolean) => {
    const el = listRef.current;
    if (!el) return;
    const target = Math.max(0, index) * ITEM_H;
    syncingRef.current = true;
    if (smooth && Math.abs(el.scrollTop - target) > 1) {
      el.scrollTo({ top: target, behavior: "smooth" });
    } else {
      el.scrollTop = target;
    }
    requestAnimationFrame(() => {
      syncingRef.current = false;
    });
  }, []);

  // Keep the wheel aligned when value changes from arrows / clicks / parent.
  React.useEffect(() => {
    if (settlingRef.current) return;
    const index = nearestIndex(values, value);
    scrollToIndex(index, false);
  }, [value, values, scrollToIndex]);

  function commitIndex(index: number, smoothSnap: boolean) {
    const list = valuesRef.current;
    const clamped = Math.min(list.length - 1, Math.max(0, index));
    const next = list[clamped]!;
    scrollToIndex(clamped, smoothSnap);
    if (next !== valueRef.current) onChangeRef.current(next);
  }

  function nudge(delta: number) {
    const list = valuesRef.current;
    const at = nearestIndex(list, valueRef.current);
    commitIndex((at + delta + list.length) % list.length, true);
  }

  function onScroll() {
    if (syncingRef.current) return;
    settlingRef.current = true;
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => {
      settlingRef.current = false;
      const el = listRef.current;
      if (!el) return;
      commitIndex(Math.round(el.scrollTop / ITEM_H), true);
    }, SCROLL_SETTLE_MS);
  }

  // Discrete mouse-wheel steps (default wheel distance jumps ~2–3 items).
  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (wheelLockRef.current) return;
      if (e.deltaY === 0 && e.deltaX === 0) return;
      const delta = e.deltaY > 0 || e.deltaX > 0 ? 1 : -1;
      wheelLockRef.current = true;
      nudge(delta);
      window.setTimeout(() => {
        wheelLockRef.current = false;
      }, WHEEL_COOLDOWN_MS);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
    // nudge closes over refs — stable for the column lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once per column
  }, []);

  return (
    <div className="flex flex-col items-center gap-1" aria-label={label}>
      <button
        type="button"
        className="flex h-7 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        onClick={() => nudge(-1)}
        aria-label={`${label} up`}
      >
        ▲
      </button>
      <div className="relative h-[108px] w-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[36px] z-0 h-9 rounded-md bg-accent/50"
        />
        <div
          ref={listRef}
          onScroll={onScroll}
          className="relative z-10 h-full touch-pan-y overflow-y-auto overscroll-contain snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="h-[36px]" aria-hidden />
          {values.map(v => (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={cn(
                "flex h-9 w-full snap-center items-center justify-center font-mono text-sm tabular-nums transition-colors",
                v === value
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground/70",
              )}
            >
              {pad(v)}
            </button>
          ))}
          <div className="h-[36px]" aria-hidden />
        </div>
      </div>
      <button
        type="button"
        className="flex h-7 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        onClick={() => nudge(1)}
        aria-label={`${label} down`}
      >
        ▼
      </button>
    </div>
  );
}

export function TimeRoller({
  hours,
  minutes,
  onChange,
  disabled,
}: {
  hours: number;
  minutes: number;
  onChange: (hours: number, minutes: number) => void;
  disabled?: boolean;
}) {
  const snappedMinutes =
    MINUTES.reduce(
      (best, v) => (Math.abs(v - minutes) < Math.abs(best - minutes) ? v : best),
      MINUTES[0]!,
    ) ?? 0;

  // Snap parent state when loaded minutes fall between 5-minute steps (e.g. 7 → 5).
  React.useEffect(() => {
    if (snappedMinutes !== minutes) {
      onChange(Math.min(23, Math.max(0, hours)), snappedMinutes);
    }
    // Only re-snap when the incoming minutes change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [minutes]);

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-xl border bg-muted/20 px-2 py-1",
        disabled && "pointer-events-none opacity-50",
      )}
      dir="ltr"
    >
      <WheelColumn
        label="Hours"
        values={HOURS}
        value={Math.min(23, Math.max(0, hours))}
        onChange={h => onChange(h, snappedMinutes)}
      />
      <span className="pb-0.5 text-lg font-semibold text-muted-foreground">:</span>
      <WheelColumn
        label="Minutes"
        values={MINUTES}
        value={snappedMinutes}
        onChange={m => onChange(Math.min(23, Math.max(0, hours)), m)}
      />
    </div>
  );
}

export const DURATION_PRESETS: { minutes: number; labelFa: string; labelEn: string }[] = [
  { minutes: 30, labelFa: "۳۰ دقیقه", labelEn: "30 min" },
  { minutes: 60, labelFa: "۱ ساعت", labelEn: "1 hour" },
  { minutes: 90, labelFa: "۱٫۵ ساعت", labelEn: "1.5 hours" },
  { minutes: 120, labelFa: "۲ ساعت", labelEn: "2 hours" },
  { minutes: 150, labelFa: "۲٫۵ ساعت", labelEn: "2.5 hours" },
  { minutes: 180, labelFa: "۳ ساعت", labelEn: "3 hours" },
  { minutes: 240, labelFa: "۴ ساعت", labelEn: "4 hours" },
];

export function formatDurationLabel(
  minutes: number,
  language: "FA" | "EN" = "FA",
): string {
  const preset = DURATION_PRESETS.find(p => p.minutes === minutes);
  if (preset) return language === "EN" ? preset.labelEn : preset.labelFa;
  if (minutes % 60 === 0) {
    const h = minutes / 60;
    return language === "EN" ? `${h}h` : `${formatNumber(h, language)} ساعت`;
  }
  if (language === "EN") return `${minutes} min`;
  return `${formatNumber(minutes, language)} دقیقه`;
}
