"use client";

import * as React from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { cn, formatNumber } from "@/lib/utils";
import {
  formatClock,
  hasDueTime,
  isOverdueTask,
  jalaliOf,
  toDateKey,
  coerceLifeArea,
} from "@/lib/life";
import {
  DAY_MINUTES,
  HOUR_HEIGHT_PX,
  SNAP_MINUTES,
  clampBlockHeight,
  durationToHeight,
  findConflicts,
  formatMinutesClock,
  minutesFromMidnight,
  minutesToY,
  snapMinutes,
  startMinutesFromPointer,
  taskSpan,
  yToMinutes,
} from "@/lib/calendar-schedule";
import { AREA_VISUAL } from "@/lib/area-visual";
import { Icon } from "@/components/ui-kit/foundation/icon";
import type { TaskRow } from "@/features/tasks/types";
import type { LifeArea } from "@/types/db";

export type HourDragPreview = {
  dateKey: string;
  startMin: number;
  durationMin: number;
  title?: string;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SLOTS_PER_DAY = DAY_MINUTES / SNAP_MINUTES;
const COLUMN_HEIGHT = HOUR_HEIGHT_PX * 24;

const AREA_CHIP: Record<LifeArea, string> = {
  PHD: AREA_VISUAL.PHD.chip,
  WORK: AREA_VISUAL.WORK.chip,
  LIFE: AREA_VISUAL.LIFE.chip,
  LANG: AREA_VISUAL.LANG.chip,
};

const AREA_DOT: Record<LifeArea, string> = {
  PHD: "bg-[var(--status-review)]",
  WORK: "bg-[var(--status-in-progress)]",
  LIFE: "bg-[var(--status-todo)]",
  LANG: "bg-emerald-600",
};

export function hoursDropId(dateKey: string) {
  return `hours:${dateKey}`;
}

export function parseHoursDropId(id: string): string | null {
  const m = id.match(/^hours:(\d{4}-\d{2}-\d{2})$/);
  return m?.[1] ?? null;
}

function taskArea(task: TaskRow): LifeArea {
  return coerceLifeArea(task.area);
}

function splitDayTasks(tasks: TaskRow[]) {
  const allDay: TaskRow[] = [];
  const timed: TaskRow[] = [];
  for (const task of tasks) {
    if (!task.dueDate) continue;
    const due = new Date(task.dueDate);
    if (Number.isNaN(due.getTime())) continue;
    if (hasDueTime(due, task.durationMinutes)) {
      timed.push(task);
    } else {
      allDay.push(task);
    }
  }
  timed.sort(
    (a, b) =>
      minutesFromMidnight(new Date(a.dueDate!)) -
      minutesFromMidnight(new Date(b.dueDate!)),
  );
  return { allDay, timed };
}

function TimedBlock({
  task,
  overdue,
  conflict,
  onOpen,
  onResizePreview,
  onResizeCommit,
}: {
  task: TaskRow;
  overdue: boolean;
  conflict: boolean;
  onOpen: () => void;
  onResizePreview: (taskId: string, durationMinutes: number) => void;
  onResizeCommit: (taskId: string, durationMinutes: number) => void;
}) {
  const language = useLanguage();
  const area = taskArea(task);
  const start = new Date(task.dueDate!);
  if (Number.isNaN(start.getTime())) return null;
  const duration = Math.max(
    SNAP_MINUTES,
    task.durationMinutes && task.durationMinutes > 0
      ? task.durationMinutes
      : 60,
  );
  const top = minutesToY(minutesFromMidnight(start), COLUMN_HEIGHT);
  const height = clampBlockHeight(top, durationToHeight(duration), COLUMN_HEIGHT);
  const clock = formatClock(
    start,
    language === "EN" ? "EN" : "FA",
    task.durationMinutes,
  );

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  function onResizePointerDown(e: React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    const startY = e.clientY;
    const startDur = duration;
    const target = e.currentTarget as HTMLElement;
    let last = startDur;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // Pointer capture can fail on some browsers/touch paths; still listen.
    }

    function cleanup(ev: PointerEvent) {
      try {
        if (target.hasPointerCapture?.(ev.pointerId)) {
          target.releasePointerCapture(ev.pointerId);
        }
      } catch {
        // ignore
      }
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", cleanup);
      window.removeEventListener("pointercancel", cleanup);
      onResizeCommit(task.id, last);
    }
    function onMove(ev: PointerEvent) {
      const deltaMin = ((ev.clientY - startY) / HOUR_HEIGHT_PX) * 60;
      last = snapMinutes(
        Math.min(
          DAY_MINUTES - minutesFromMidnight(start),
          Math.max(SNAP_MINUTES, startDur + deltaMin),
        ),
      );
      onResizePreview(task.id, last);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", cleanup);
    window.addEventListener("pointercancel", cleanup);
  }

  return (
    <div
      ref={setNodeRef}
      style={{ top, height }}
      className={cn(
        "absolute inset-x-0.5 z-[2] flex flex-col overflow-hidden rounded-md text-[11px] font-medium leading-tight shadow-sm",
        AREA_CHIP[area],
        overdue &&
          "ring-2 ring-[var(--status-blocked)] shadow-[inset_3px_0_0_0_var(--status-blocked)]",
        conflict && "ring-2 ring-amber-400",
        task.status === "DONE" && "opacity-45 line-through",
        isDragging && "opacity-40",
      )}
    >
      <button
        type="button"
        {...listeners}
        {...attributes}
        onClick={e => {
          e.stopPropagation();
          if (!isDragging) onOpen();
        }}
        title={
          clock
            ? `${task.title} · ${clock}${conflict ? " ⚠" : ""}`
            : task.title
        }
        className="relative flex min-h-0 flex-1 cursor-grab touch-none flex-col items-center justify-center gap-0.5 overflow-hidden px-1 py-0.5 text-center active:cursor-grabbing"
      >
        {overdue ? (
          <span className="pointer-events-none absolute start-0.5 top-0.5 opacity-95">
            <Icon name="alert-triangle" size={10} />
          </span>
        ) : null}
        <span className="line-clamp-2 w-full">{task.title}</span>
        {clock ? (
          <span className="block w-full tabular-nums opacity-90">{clock}</span>
        ) : null}
      </button>
      <div
        role="separator"
        aria-label="Resize duration"
        onPointerDown={onResizePointerDown}
        className="h-2 shrink-0 cursor-ns-resize touch-none bg-black/15 hover:bg-black/30"
      />
    </div>
  );
}

function AllDayChip({
  task,
  overdue,
  onOpen,
}: {
  task: TaskRow;
  overdue: boolean;
  onOpen: () => void;
}) {
  const area = taskArea(task);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      onClick={e => {
        e.stopPropagation();
        if (!isDragging) onOpen();
      }}
      className={cn(
        "flex w-full min-w-0 items-center gap-1.5 truncate rounded-md border px-2 py-1 text-start text-[11px] font-medium leading-4 shadow-sm",
        AREA_CHIP[area],
        overdue
          ? "border-[var(--status-blocked-border)] ring-2 ring-[var(--status-blocked)]"
          : "border-black/10",
        task.status === "DONE" && "opacity-45 line-through",
        isDragging && "opacity-40",
        "cursor-grab active:cursor-grabbing touch-none",
      )}
    >
      {overdue ? (
        <Icon
          name="alert-triangle"
          size={11}
          className="shrink-0 text-[var(--status-blocked)]"
        />
      ) : (
        <span
          className={cn("size-1.5 shrink-0 rounded-full bg-white/80", AREA_DOT[area])}
        />
      )}
      <span className="min-w-0 truncate">{task.title}</span>
    </button>
  );
}

const ALL_DAY_STRIP_MIN_H = "min-h-[3.25rem]";

function AllDayDropZone({
  dateKey,
  empty,
  children,
}: {
  dateKey: string;
  empty?: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslation();
  const { setNodeRef, isOver } = useDroppable({
    id: dateKey,
    data: { type: "allDay" as const, dateKey },
  });

  return (
    <div
      ref={setNodeRef}
      data-all-day={dateKey}
      className={cn(
        ALL_DAY_STRIP_MIN_H,
        "shrink-0 space-y-1 border-b border-dashed border-border/80 bg-[linear-gradient(180deg,var(--muted)_0%,transparent_100%)] p-1.5",
        isOver && "bg-primary/15 ring-1 ring-inset ring-primary/40",
      )}
    >
      {empty ? (
        <p className="px-0.5 py-1 text-center text-[10px] leading-tight text-muted-foreground/80">
          {t.life.calendarAllDayHint}
        </p>
      ) : (
        children
      )}
    </div>
  );
}

function HoursDropZone({
  dateKey,
  preview,
  children,
}: {
  dateKey: string;
  preview?: HourDragPreview | null;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: hoursDropId(dateKey),
    data: { type: "hours" as const, dateKey },
  });

  const showPreview = preview && preview.dateKey === dateKey;
  const previewTop = showPreview
    ? minutesToY(preview.startMin, COLUMN_HEIGHT)
    : 0;
  const previewHeight = showPreview
    ? clampBlockHeight(
        previewTop,
        durationToHeight(preview.durationMin),
        COLUMN_HEIGHT,
      )
    : 0;

  return (
    <div
      ref={setNodeRef}
      data-day-hours={dateKey}
      className={cn(
        "relative",
        isOver && "bg-primary/5",
      )}
      style={{ height: COLUMN_HEIGHT }}
    >
      {Array.from({ length: SLOTS_PER_DAY }, (_, i) => {
        const minutes = i * SNAP_MINUTES;
        const isHour = minutes % 60 === 0;
        const isHalf = minutes % 60 === 30;
        return (
          <div
            key={minutes}
            aria-hidden
            className={cn(
              "absolute inset-x-0 pointer-events-none border-t",
              isHour
                ? "border-border/70"
                : isHalf
                  ? "border-border/40"
                  : "border-border/20",
            )}
            style={{ top: minutesToY(minutes, COLUMN_HEIGHT) }}
          />
        );
      })}
      {children}
      {showPreview ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0.5 z-[3] flex flex-col items-center justify-center overflow-hidden rounded-md border-2 border-primary bg-primary/20 px-1 py-0.5 text-center text-[11px] font-medium text-primary shadow-sm"
          style={{ top: previewTop, height: previewHeight }}
        >
          {preview.title ? (
            <span className="line-clamp-2 w-full opacity-90">{preview.title}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function DayColumn({
  date,
  dayTasks,
  isToday,
  isSelected,
  isFriday,
  lastCol,
  dayNumber,
  wide,
  dragPreview,
  onSelect,
  onOpenTask,
  onResizePreview,
  onResizeCommit,
}: {
  date: Date;
  dayTasks: TaskRow[];
  isToday: boolean;
  isSelected: boolean;
  isFriday: boolean;
  lastCol: boolean;
  dayNumber: string;
  wide?: boolean;
  dragPreview?: HourDragPreview | null;
  onSelect: () => void;
  onOpenTask: (task: TaskRow) => void;
  onResizePreview: (taskId: string, durationMinutes: number) => void;
  onResizeCommit: (taskId: string, durationMinutes: number) => void;
}) {
  const t = useTranslation();
  const key = toDateKey(date);
  const { allDay, timed } = splitDayTasks(dayTasks);
  const conflicts = findConflicts(
    timed
      .map(task => {
        const due = new Date(task.dueDate!);
        if (Number.isNaN(due.getTime())) return null;
        return taskSpan(task.id, due, task.durationMinutes);
      })
      .filter((s): s is NonNullable<typeof s> => s != null),
  );
  const conflictCount = conflicts.size;

  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-col",
        !lastCol && "border-e",
        isFriday && "bg-[var(--status-blocked-tint)]/15",
        isSelected && "bg-primary/5",
        wide && "min-w-0 flex-1",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex h-10 shrink-0 flex-col items-center justify-center gap-0.5 border-b hover:bg-accent/40"
      >
        <span
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-full text-[13px] font-medium",
            isToday &&
              "bg-primary text-primary-foreground font-semibold shadow-sm",
          )}
        >
          {dayNumber}
        </span>
        {conflictCount > 0 ? (
          <span className="text-[10px] font-medium text-amber-600">
            {t.life.scheduleConflict}: {conflictCount}
          </span>
        ) : null}
      </button>

      <AllDayDropZone dateKey={key} empty={allDay.length === 0}>
        {allDay.map(task => (
          <AllDayChip
            key={task.id}
            task={task}
            overdue={isOverdueTask(task)}
            onOpen={() => onOpenTask(task)}
          />
        ))}
      </AllDayDropZone>

      <HoursDropZone dateKey={key} preview={dragPreview}>
        {timed.map(task => (
          <TimedBlock
            key={task.id}
            task={task}
            overdue={isOverdueTask(task)}
            conflict={(conflicts.get(task.id)?.length ?? 0) > 0}
            onOpen={() => onOpenTask(task)}
            onResizePreview={onResizePreview}
            onResizeCommit={onResizeCommit}
          />
        ))}
      </HoursDropZone>
    </div>
  );
}

function TimeGutter({ language }: { language: "FA" | "EN" }) {
  const t = useTranslation();
  return (
    <div className="relative border-e bg-card">
      <div className="h-10 border-b" />
      <div
        className={cn(
          ALL_DAY_STRIP_MIN_H,
          "flex items-center justify-center border-b border-dashed border-border/80 bg-[linear-gradient(180deg,var(--muted)_0%,transparent_100%)] px-0.5",
        )}
      >
        <span className="max-w-full text-center text-[9px] font-medium leading-tight text-muted-foreground">
          {t.life.calendarAllDay}
        </span>
      </div>
      <div className="relative" style={{ height: COLUMN_HEIGHT }}>
        {HOURS.map(hour => (
          <div
            key={hour}
            className="absolute inset-x-0 flex justify-end pe-1.5"
            style={{ top: hour * HOUR_HEIGHT_PX, height: HOUR_HEIGHT_PX }}
          >
            <span className="-mt-2 text-[10px] tabular-nums text-muted-foreground">
              {formatNumber(`${String(hour).padStart(2, "0")}:00`, language)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WeekHourGrid({
  cells,
  byDay,
  selected,
  today,
  weekdays,
  language,
  mode = "week",
  dragPreview = null,
  onSelectDay,
  onOpenTask,
  onResizePreview,
  onResizeCommit,
}: {
  cells: Date[];
  byDay: Map<string, TaskRow[]>;
  selected: Date;
  today: Date;
  weekdays: string[];
  language: "FA" | "EN";
  mode?: "week" | "day";
  dragPreview?: HourDragPreview | null;
  onSelectDay: (date: Date) => void;
  onOpenTask: (task: TaskRow, date: Date) => void;
  onResizePreview: (taskId: string, durationMinutes: number) => void;
  onResizeCommit: (taskId: string, durationMinutes: number) => void;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const visibleCells = mode === "day" ? [selected] : cells;
  const visibleWeekdays =
    mode === "day"
      ? [
          weekdays[
            (() => {
              // Saturday-based index
              const satIndex = (selected.getDay() + 1) % 7;
              return satIndex;
            })()
          ] ?? "",
        ]
      : weekdays;

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function earliestTimedMinutes(dates: Date[]): number | null {
      let earliest: number | null = null;
      for (const date of dates) {
        const list = byDay.get(toDateKey(date)) ?? [];
        for (const task of list) {
          if (!task.dueDate) continue;
          const due = new Date(task.dueDate);
          if (Number.isNaN(due.getTime())) continue;
          if (!hasDueTime(due, task.durationMinutes)) continue;
          const mins = minutesFromMidnight(due);
          if (earliest == null || mins < earliest) earliest = mins;
        }
      }
      return earliest;
    }

    // Prefer the selected day so language/PhD afternoon blocks aren't below the fold.
    const selectedEarliest = earliestTimedMinutes([selected]);
    const weekEarliest = earliestTimedMinutes(visibleCells);
    const target =
      selectedEarliest ?? weekEarliest ?? 7 * 60;
    const padded = Math.max(0, target - 30);
    el.scrollTop = (padded / 60) * HOUR_HEIGHT_PX;
  }, [mode, selected, byDay, cells]);

  function sameDay(a: Date, b: Date) {
    return toDateKey(a) === toDateKey(b);
  }

  const gridCols =
    mode === "day"
      ? "grid-cols-[3.25rem_minmax(0,1fr)]"
      : "grid-cols-[3.25rem_repeat(7,minmax(0,1fr))]";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className={cn("grid shrink-0 border-b bg-muted/30", gridCols)}>
        <div className="border-e" />
        {visibleWeekdays.map((day, index) => (
          <div
            key={`${day}-${index}`}
            className={cn(
              "px-1 py-2 text-center text-[11px] font-medium tracking-wide text-muted-foreground",
              mode === "week" && index === 6 && "text-[var(--status-blocked)]",
            )}
          >
            {day}
          </div>
        ))}
      </div>

      <div ref={scrollRef} data-hour-scroll className="min-h-0 flex-1 overflow-auto">
        <div className={cn("grid", gridCols)}>
          <TimeGutter language={language} />
          {visibleCells.map((date, index) => {
            const key = toDateKey(date);
            const jalali = jalaliOf(date);
            return (
              <DayColumn
                key={key}
                date={date}
                dayTasks={byDay.get(key) ?? []}
                isToday={sameDay(date, today)}
                isSelected={sameDay(date, selected)}
                isFriday={date.getDay() === 5}
                lastCol={index === visibleCells.length - 1}
                dayNumber={formatNumber(jalali.jd, language)}
                wide={mode === "day"}
                dragPreview={dragPreview}
                onSelect={() => onSelectDay(date)}
                onOpenTask={task => onOpenTask(task, date)}
                onResizePreview={onResizePreview}
                onResizeCommit={onResizeCommit}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Resolve drop Y inside a day hours column from drag end coordinates. */
export function minutesFromClientY(
  clientY: number,
  columnTop: number,
  columnHeight: number,
): number {
  return yToMinutes(clientY - columnTop, columnHeight);
}

/** All-day strip under the pointer (takes priority over hour-grid X fallback). */
export function findAllDayAtPoint(
  clientX: number,
  clientY: number,
): string | null {
  if (typeof document === "undefined") return null;
  for (const el of document.querySelectorAll("[data-all-day]")) {
    if (!(el instanceof HTMLElement)) continue;
    const dateKey = el.dataset.allDay;
    if (!dateKey) continue;
    const rect = el.getBoundingClientRect();
    if (
      clientX >= rect.left &&
      clientX < rect.right &&
      clientY >= rect.top &&
      clientY < rect.bottom
    ) {
      return dateKey;
    }
  }
  return null;
}

/**
 * Find the hours column under a pointer by geometry (not elementsFromPoint).
 * More reliable under DragOverlay / ghost layers.
 *
 * Only returns a column when the pointer Y is inside the hours rect, or
 * slightly below it (clamp to end of day). Does **not** treat the all-day
 * strip / day header above the grid as an hours hit — callers should check
 * `findAllDayAtPoint` first.
 */
export function findHoursColumnAtPoint(
  clientX: number,
  clientY: number,
): { dateKey: string; rect: DOMRect } | null {
  if (typeof document === "undefined") return null;
  const cols = document.querySelectorAll("[data-day-hours]");
  let belowMatch: { dateKey: string; rect: DOMRect } | null = null;

  for (const el of cols) {
    if (!(el instanceof HTMLElement)) continue;
    const dateKey = el.dataset.dayHours;
    if (!dateKey) continue;
    const rect = el.getBoundingClientRect();
    if (clientX < rect.left || clientX >= rect.right) continue;
    if (clientY >= rect.top && clientY < rect.bottom) {
      return { dateKey, rect };
    }
    // Pointer below the column (past midnight edge / padding) → clamp later.
    if (clientY >= rect.bottom && !belowMatch) {
      belowMatch = { dateKey, rect };
    }
  }

  return belowMatch;
}

/** @deprecated prefer findHoursColumnAtPoint + startMinutesFromPointer */
export function minutesFromDragEnd(
  dateKey: string,
  clientY: number,
): number | null {
  const el = document.querySelector(
    `[data-day-hours="${dateKey}"]`,
  ) as HTMLElement | null;
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return minutesFromClientY(clientY, rect.top, COLUMN_HEIGHT);
}

export { startMinutesFromPointer, formatMinutesClock, COLUMN_HEIGHT };
