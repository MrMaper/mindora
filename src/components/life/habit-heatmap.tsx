"use client";

import * as React from "react";
import { useLanguage, useTranslation } from "@/i18n/provider";
import type { HabitHeatDay, HabitItem } from "@/features/habits/queries";
import {
  formatJalaliShort,
  jalaliOf,
  parseLocalDate,
  PERSIAN_MONTHS,
  toDateKey,
} from "@/lib/life";
import { cn } from "@/lib/utils";

import {
  HABIT_HEATMAP_CELL_PX,
  HABIT_HEATMAP_GAP_PX,
  HABIT_HEATMAP_WEEKS,
} from "@/features/habits/constants";

const CELL = HABIT_HEATMAP_CELL_PX;
const GAP = HABIT_HEATMAP_GAP_PX;

const LEVEL_CLASS = [
  "bg-muted",
  "bg-emerald-200 dark:bg-emerald-950",
  "bg-emerald-300 dark:bg-emerald-800",
  "bg-emerald-500 dark:bg-emerald-600",
  "bg-emerald-700 dark:bg-emerald-400",
] as const;

/** Sat → Fri (matches startOfWeek Saturday grid). */
const WEEKDAY_FA = ["ش", "ی", "د", "س", "چ", "پ", "ج"] as const;
const WEEKDAY_EN = ["Sa", "Su", "Mo", "Tu", "We", "Th", "Fr"] as const;

function intensity(
  count: number,
  habitCount: number,
  singleHabit: boolean,
): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (singleHabit) return 3;
  const max = Math.max(1, habitCount);
  if (count >= max) return 4;
  if (count >= Math.ceil(max * 0.75)) return 3;
  if (count >= Math.ceil(max * 0.5)) return 2;
  return 1;
}

function monthLabel(date: Date, language: "FA" | "EN"): string {
  if (language === "EN") {
    return date.toLocaleDateString("en-US", { month: "short" });
  }
  const { jm } = jalaliOf(date);
  return PERSIAN_MONTHS[jm - 1] ?? "";
}

function weeksThatFit(width: number, labelColW: number): number {
  const step = CELL + GAP;
  if (width <= labelColW + step) return 1;
  return Math.max(1, Math.floor((width - labelColW) / step));
}

export function HabitHeatmap({
  habits,
  days,
  filterId,
  onFilterChange,
}: {
  habits: HabitItem[];
  days: HabitHeatDay[];
  filterId: string;
  onFilterChange: (id: string) => void;
}) {
  const t = useTranslation();
  const language = useLanguage();
  const todayKey = toDateKey(new Date());
  const single = filterId !== "all";
  const isFa = language === "FA";
  const weekdayShort = isFa ? WEEKDAY_FA : WEEKDAY_EN;
  const labelColW = isFa ? 16 : 22;

  const shellRef = React.useRef<HTMLDivElement>(null);
  const [fitWeeks, setFitWeeks] = React.useState(16);

  const allColumns = React.useMemo(() => {
    const cols: HabitHeatDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      cols.push(days.slice(i, i + 7));
    }
    return cols;
  }, [days]);

  React.useLayoutEffect(() => {
    const el = shellRef.current;
    if (!el) return;

    const measure = () => {
      const width = el.clientWidth;
      const fit = weeksThatFit(width, labelColW);
      const available = allColumns.length || HABIT_HEATMAP_WEEKS;
      const next = Math.min(available, Math.max(1, fit));
      setFitWeeks(prev => (prev === next ? prev : next));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [allColumns.length, labelColW]);

  // Keep the newest weeks; older history scrolls off when the viewport is narrow.
  const columns = allColumns.slice(-fitWeeks);
  // FA + dir=rtl: newest week on the inline-start (right)
  const displayColumns = isFa ? [...columns].reverse() : columns;
  const weekCount = displayColumns.length;

  const monthMarks: { col: number; label: string }[] = [];
  let prevMonth = "";
  displayColumns.forEach((col, idx) => {
    const first = col[0];
    if (!first) return;
    const label = monthLabel(parseLocalDate(first.dateKey), language);
    if (label && label !== prevMonth) {
      monthMarks.push({ col: idx, label });
      prevMonth = label;
    }
  });

  function tip(day: HabitHeatDay): string {
    const d = parseLocalDate(day.dateKey);
    const dateLabel = formatJalaliShort(d, language);
    if (day.count <= 0) {
      return t.habits.heatmapNone.replace("{date}", dateLabel);
    }
    return t.habits.heatmapDone
      .replace("{count}", String(day.count))
      .replace("{date}", dateLabel);
  }

  if (allColumns.length === 0) return null;

  const gridWidth = labelColW + weekCount * CELL + GAP * Math.max(0, weekCount);
  const gridCols = `${labelColW}px repeat(${weekCount}, ${CELL}px)`;
  const step = CELL + GAP;

  return (
    <div className="mb-3 w-full min-w-0">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-muted-foreground">
          {t.habits.heatmap}
        </span>
        <div className="flex min-w-0 flex-wrap justify-end gap-1">
          <FilterChip
            active={filterId === "all"}
            onClick={() => onFilterChange("all")}
            label={t.habits.heatmapAll}
          />
          {habits.map(h => (
            <FilterChip
              key={h.id}
              active={filterId === h.id}
              onClick={() => onFilterChange(h.id)}
              label={h.title}
            />
          ))}
        </div>
      </div>

      <div ref={shellRef} className="w-full min-w-0" dir={isFa ? "rtl" : "ltr"}>
        <div className="w-full" style={{ minHeight: 7 * CELL + 6 * GAP + 28 }}>
          {/* Month captions — absolute so names are not clipped to one cell */}
          <div
            className="relative mb-1 h-3.5 w-full"
            style={{ width: gridWidth, maxWidth: "100%" }}
          >
            {monthMarks.map(mark => (
              <span
                key={`${mark.col}-${mark.label}`}
                className="absolute top-0 whitespace-nowrap text-[10px] leading-none text-muted-foreground"
                style={
                  isFa
                    ? {
                        right: labelColW + GAP + mark.col * step,
                      }
                    : {
                        left: labelColW + GAP + mark.col * step,
                      }
                }
              >
                {mark.label}
              </span>
            ))}
          </div>

          <div
            className="grid"
            style={{
              width: gridWidth,
              maxWidth: "100%",
              gridTemplateColumns: gridCols,
              gridTemplateRows: `repeat(7, ${CELL}px)`,
              gap: GAP,
            }}
          >
            {weekdayShort.map((label, row) => (
              <React.Fragment key={`row-${row}`}>
                <div
                  className={cn(
                    "flex items-center text-[10px] leading-none text-muted-foreground",
                    isFa ? "justify-start pe-0.5" : "justify-end pe-0.5",
                  )}
                  style={{ gridColumn: 1, gridRow: row + 1 }}
                >
                  {label}
                </div>
                {displayColumns.map((col, ci) => {
                  const day = col[row];
                  if (!day) return null;
                  const future = day.dateKey > todayKey;
                  const level = future
                    ? 0
                    : intensity(day.count, habits.length, single);
                  return (
                    <div
                      key={day.dateKey}
                      title={future ? undefined : tip(day)}
                      className={cn(
                        "rounded-[2px]",
                        LEVEL_CLASS[level],
                        future && "opacity-30",
                        day.dateKey === todayKey && "ring-1 ring-foreground/40",
                      )}
                      style={{
                        gridColumn: ci + 2,
                        gridRow: row + 1,
                        width: CELL,
                        height: CELL,
                      }}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          {/* Legend: کمتر → … → بیشتر in reading direction (RTL-aware via dir) */}
          <div
            className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground"
            style={{
              width: gridWidth,
              maxWidth: "100%",
              paddingInlineStart: labelColW + GAP,
            }}
          >
            <span>{t.habits.heatmapLess}</span>
            {LEVEL_CLASS.map(cls => (
              <span
                key={cls}
                className={cn("inline-block rounded-[2px]", cls)}
                style={{
                  width: Math.max(8, CELL - 2),
                  height: Math.max(8, CELL - 2),
                }}
              />
            ))}
            <span>{t.habits.heatmapMore}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "max-w-[9rem] truncate rounded-md border px-1.5 py-0.5 text-[10px] transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-transparent bg-muted/60 text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}

export { HABIT_HEATMAP_WEEKS };
