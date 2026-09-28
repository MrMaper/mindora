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
  minutesFromMidnight,
  minutesToY,
  snapMinutes,
  taskSpan,
  yToMinutes,
} from "@/lib/calendar-schedule";
import { AREA_VISUAL } from "@/lib/area-visual";
import type { TaskRow } from "@/features/tasks/types";
import type { LifeArea } from "@/types/db";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
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
        "absolute inset-x-0.5 z-[2] flex flex-col overflow-hidden rounded-md text-start text-[11px] font-medium leading-tight shadow-sm",
        AREA_CHIP[area],
        overdue && "ring-1 ring-[var(--status-blocked)]",
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
        className="min-h-0 flex-1 cursor-grab touch-none overflow-hidden px-1 py-0.5 text-start active:cursor-grabbing"
      >
        <span className="line-clamp-2">{task.title}</span>
        {clock ? (
          <span className="mt-0.5 block tabular-nums opacity-90">{clock}</span>
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
        "flex w-full min-w-0 items-center gap-1 truncate rounded-[5px] px-1.5 py-[3px] text-start text-[11px] font-medium leading-4",
        AREA_CHIP[area],
        overdue && "ring-1 ring-[var(--status-blocked)]",
        task.status === "DONE" && "opacity-45 line-through",
        isDragging && "opacity-40",
        "cursor-grab active:cursor-grabbing touch-none",
      )}
    >
      <span
        className={cn("size-1.5 shrink-0 rounded-full bg-white/80", AREA_DOT[area])}
      />
      <span className="min-w-0 truncate">{task.title}</span>
    </button>
  );
}

function AllDayDropZone({
  dateKey,
  children,
}: {
  dateKey: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: dateKey,
    data: { type: "allDay" as const, dateKey },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[2.5rem] shrink-0 space-y-0.5 border-b bg-muted/20 p-0.5",
        isOver && "bg-primary/15 ring-1 ring-inset ring-primary/40",
      )}
    >
      {children}
    </div>
  );
}

function HoursDropZone({
  dateKey,
  children,
}: {
  dateKey: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: hoursDropId(dateKey),
    data: { type: "hours" as const, dateKey },
  });

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
      {HOURS.map(hour => (
        <div
          key={hour}
          className="absolute inset-x-0 border-b border-border/60 pointer-events-none"
          style={{ top: hour * HOUR_HEIGHT_PX, height: HOUR_HEIGHT_PX }}
        />
      ))}
      {children}
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
  today,
  wide,
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
  today: Date;
  wide?: boolean;
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

      <AllDayDropZone dateKey={key}>
        {allDay.map(task => (
          <AllDayChip
            key={task.id}
            task={task}
            overdue={isOverdueTask(task, today)}
            onOpen={() => onOpenTask(task)}
          />
        ))}
      </AllDayDropZone>

      <HoursDropZone dateKey={key}>
        {timed.map(task => (
          <TimedBlock
            key={task.id}
            task={task}
            overdue={isOverdueTask(task, today)}
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
  return (
    <div className="relative border-e bg-card">
      <div className="h-10 border-b" />
      <div className="min-h-[2.5rem] border-b bg-muted/20" />
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
    el.scrollTop = 7 * HOUR_HEIGHT_PX;
  }, [mode, selected]);

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

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
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
                today={today}
                wide={mode === "day"}
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

/** @deprecated prefer minutesFromClientY with over.rect */
export function minutesFromDragEnd(
  dateKey: string,
  clientY: number,
): number | null {
  const el = document.querySelector(
    `[data-day-hours="${dateKey}"]`,
  ) as HTMLElement | null;
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return minutesFromClientY(clientY, rect.top, rect.height);
}
