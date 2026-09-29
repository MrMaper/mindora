"use client";

import * as React from "react";
import { useLanguage, useTranslation } from "@/i18n/provider";
import type { HabitHeatDay, HabitItem } from "@/features/habits/actions";
import {
  formatJalaliShort,
  jalaliOf,
  parseLocalDate,
  PERSIAN_MONTHS,
  toDateKey,
} from "@/lib/life";
import { cn } from "@/lib/utils";

const WEEKS = 20;
const LEVEL_CLASS = [
  "bg-muted",
  "bg-emerald-200 dark:bg-emerald-950",
  "bg-emerald-300 dark:bg-emerald-800",
  "bg-emerald-500 dark:bg-emerald-600",
  "bg-emerald-700 dark:bg-emerald-400",
] as const;

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

  const columns: HabitHeatDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    columns.push(days.slice(i, i + 7));
  }

  // FA + dir=rtl: put newest first in the array so it lands on the right
  const displayColumns = isFa ? [...columns].reverse() : columns;

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

  const weekdayShort = isFa
    ? ["ش", "ی", "د", "س", "چ", "پ", "ج"]
    : ["Sa", "Su", "Mo", "Tu", "We", "Th", "Fr"];

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

  if (columns.length === 0) return null;

  const weekLabels = (
    <div className="flex w-5 shrink-0 flex-col gap-[3px]" aria-hidden>
      {weekdayShort.map((label, row) => (
        <div
          key={`${label}-${row}`}
          className={cn(
            "flex h-3 items-center text-[9px] leading-none text-muted-foreground",
            isFa ? "justify-start pe-0.5" : "justify-end pe-0.5",
          )}
        >
          {label}
        </div>
      ))}
    </div>
  );

  return (
    <div className="mb-4 w-full">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-muted-foreground">
          {t.habits.heatmap}
        </span>
        <div className="flex flex-wrap gap-1">
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

      <div className="w-full overflow-x-auto">
        <div
          className="flex w-full min-w-[18rem] flex-col gap-1"
          dir={isFa ? "rtl" : "ltr"}
        >
          {/* Month row: spacer for weekday col + one label per week */}
          <div className="flex w-full gap-[3px]">
            <div className="w-5 shrink-0" aria-hidden />
            <div
              className="grid min-w-0 flex-1 gap-[3px]"
              style={{
                gridTemplateColumns: `repeat(${displayColumns.length}, minmax(0, 1fr))`,
              }}
            >
              {displayColumns.map((_, idx) => {
                const mark = monthMarks.find(m => m.col === idx);
                return (
                  <div
                    key={`m-${idx}`}
                    className="truncate text-[9px] leading-none text-muted-foreground"
                  >
                    {mark?.label ?? ""}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex w-full gap-[3px]">
            {weekLabels}
            <div
              className="grid min-w-0 flex-1 gap-[3px]"
              style={{
                gridTemplateColumns: `repeat(${displayColumns.length}, minmax(0, 1fr))`,
              }}
            >
              {displayColumns.map((col, ci) => (
                <div key={ci} className="flex flex-col gap-[3px]">
                  {col.map(day => {
                    const future = day.dateKey > todayKey;
                    const level = future
                      ? 0
                      : intensity(day.count, habits.length, single);
                    return (
                      <div
                        key={day.dateKey}
                        title={future ? undefined : tip(day)}
                        className={cn(
                          "aspect-square w-full min-h-3 rounded-[2px]",
                          LEVEL_CLASS[level],
                          future && "opacity-30",
                          day.dateKey === todayKey &&
                            "ring-1 ring-foreground/40",
                        )}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-start gap-1 pt-1 text-[10px] text-muted-foreground">
            <span>{t.habits.heatmapLess}</span>
            {LEVEL_CLASS.map((cls, i) => (
              <span key={i} className={cn("h-2.5 w-2.5 rounded-[2px]", cls)} />
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
        "max-w-[7rem] truncate rounded-md border px-1.5 py-0.5 text-[10px] transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent",
      )}
    >
      {label}
    </button>
  );
}

export const HABIT_HEATMAP_WEEKS = WEEKS;
