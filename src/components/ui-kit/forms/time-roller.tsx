"use client";

import * as React from "react";
import { cn, formatNumber } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function pad(n: number) {
  return String(n).padStart(2, "0");
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
  const itemH = 36;

  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const index = Math.max(0, values.indexOf(value));
    el.scrollTop = index * itemH;
  }, [value, values]);

  function onScroll() {
    const el = listRef.current;
    if (!el) return;
    const index = Math.round(el.scrollTop / itemH);
    const next = values[Math.min(values.length - 1, Math.max(0, index))];
    if (next !== undefined && next !== value) onChange(next);
  }

  function nudge(delta: number) {
    const index = values.indexOf(value);
    const fallback = values.reduce(
      (best, v) => (Math.abs(v - value) < Math.abs(best - value) ? v : best),
      values[0]!,
    );
    const at = index >= 0 ? index : values.indexOf(fallback);
    const next = values[(at + delta + values.length) % values.length];
    if (next !== undefined) onChange(next);
  }

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
          className="relative z-10 h-full overflow-y-auto scroll-smooth snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="h-[36px]" />
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
          <div className="h-[36px]" />
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
