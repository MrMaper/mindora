"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  closestCenter,
  pointerWithin,
} from "@dnd-kit/core";
import type {
  CollisionDetection,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import { Button } from "@/components/ui-kit/forms/button";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { LifeTaskList } from "@/components/life/life-task-list";
import { QuickCapture } from "@/components/life/quick-capture";
import { CapturePageDate } from "@/components/life/capture-provider";
import { listDocsByTaskIdsAction } from "@/features/docs/actions";
import { EditTaskDrawer } from "../kanban/components/ui/edit-task-drawer";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { formatNumber, cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  LIFE_AREAS,
  PERSIAN_WEEKDAYS_SAT,
  addDays,
  addJalaliMonth,
  endOfWeek,
  formatJalaliDate,
  formatJalaliMonthYear,
  formatJalaliWeekRange,
  formatClock,
  isOverdueTask,
  moveDueToDay,
  setDueDateTime,
  withDateOnly,
  jalaliMonthBounds,
  jalaliMonthCells,
  jalaliOf,
  parseLocalDate,
  startOfDay,
  startOfWeek,
  toDateKey,
  toDueDateKey,
  toGregorianDate,
  weekCells,
  zonedDateKey,
  coerceLifeArea,
} from "@/lib/life";
import {
  loadCalendarRange,
  rescheduleTaskDueDate,
  rescheduleTaskSchedule,
} from "@/features/life/actions";
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
} from "@/features/tasks/types";
import type { TaskRow } from "@/features/tasks/types";
import type { LifeArea } from "@/types/db";
import type { UserRow } from "@/features/users/types";
import type { LabelRow } from "@/features/labels/types";
import type { ProjectRow } from "@/features/projects/types";
import { useLifeTaskEdit } from "@/features/life/use-life-task-edit";
import {
  WeekHourGrid,
  findAllDayAtPoint,
  findHoursColumnAtPoint,
  parseHoursDropId,
  type HourDragPreview,
} from "./week-hour-grid";
import {
  HOUR_HEIGHT_PX,
  SNAP_MINUTES,
  durationToHeight,
  formatMinutesClock,
  parseClockTime,
  startMinutesFromPointer,
} from "@/lib/calendar-schedule";

import { AREA_VISUAL } from "@/lib/area-visual";

const COLUMN_HEIGHT = HOUR_HEIGHT_PX * 24;

const AREA_CHIP: Record<LifeArea, string> = {
  PHD: AREA_VISUAL.PHD.chip,
  WORK: AREA_VISUAL.WORK.chip,
  LIFE: AREA_VISUAL.LIFE.chip,
  LANG: AREA_VISUAL.LANG.chip,
};

const AREA_ACCENT: Record<LifeArea, string> = {
  PHD: "border-s-[var(--status-review)]",
  WORK: "border-s-[var(--status-in-progress)]",
  LIFE: "border-s-[var(--status-todo)]",
  LANG: "border-s-emerald-600",
};

const AREA_OVERDUE_WASH: Record<LifeArea, string> = {
  PHD: "bg-[linear-gradient(to_inline-end,color-mix(in_srgb,var(--status-review)_22%,var(--status-blocked-tint))_0%,var(--status-blocked-tint)_60%)]",
  WORK: "bg-[linear-gradient(to_inline-end,color-mix(in_srgb,var(--status-in-progress)_22%,var(--status-blocked-tint))_0%,var(--status-blocked-tint)_60%)]",
  LIFE: "bg-[linear-gradient(to_inline-end,color-mix(in_srgb,var(--status-todo)_22%,var(--status-blocked-tint))_0%,var(--status-blocked-tint)_60%)]",
  LANG: "bg-[linear-gradient(to_inline-end,color-mix(in_srgb,#059669_22%,var(--status-blocked-tint))_0%,var(--status-blocked-tint)_60%)]",
};

const AREA_DOT: Record<LifeArea, string> = {
  PHD: AREA_VISUAL.PHD.dot,
  WORK: AREA_VISUAL.WORK.dot,
  LIFE: AREA_VISUAL.LIFE.dot,
  LANG: AREA_VISUAL.LANG.dot,
};

const WEEKDAYS_EN = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

type CalendarView = "month" | "week" | "day";

const calendarCollision: CollisionDetection = args => {
  const hits = pointerWithin(args);
  if (hits.length === 0) return closestCenter(args);
  // All-day strip must win over the tall hours column under the same day.
  const allDay = hits.filter(h => {
    const data = h.data?.droppableContainer?.data.current as
      | { type?: string }
      | undefined;
    return data?.type === "allDay";
  });
  if (allDay.length > 0) return allDay;
  const hours = hits.filter(h => String(h.id).startsWith("hours:"));
  if (hours.length > 0) return hours;
  return hits;
};

function taskArea(task: TaskRow): LifeArea {
  return coerceLifeArea(task.area);
}

/**
 * Date-only dues written on a UTC server as noon UTC show up as afternoon
 * timed blocks in +3:30 (and similar) zones — visible in month chips, easy to
 * miss on the week/day hour grid. Remap bare UTC-noon (no duration) to the
 * local date-only sentinel so they sit in the all-day strip.
 */
function coerceCalendarTask(task: TaskRow): TaskRow {
  if (!task.dueDate) return task;
  if (task.durationMinutes != null && task.durationMinutes > 0) return task;
  const due = new Date(task.dueDate);
  if (Number.isNaN(due.getTime())) return task;
  if (due.getHours() === 12 && due.getMinutes() === 0) return task;
  if (
    due.getUTCHours() === 12 &&
    due.getUTCMinutes() === 0 &&
    due.getUTCSeconds() === 0 &&
    due.getUTCMilliseconds() === 0
  ) {
    const key = [
      due.getUTCFullYear(),
      String(due.getUTCMonth() + 1).padStart(2, "0"),
      String(due.getUTCDate()).padStart(2, "0"),
    ].join("-");
    return { ...task, dueDate: withDateOnly(parseLocalDate(key)) };
  }
  // Iran date-only on a UTC host (08:30 UTC) — keep as local noon for the grid.
  if (
    due.getUTCHours() === 8 &&
    due.getUTCMinutes() === 30 &&
    due.getUTCSeconds() === 0 &&
    due.getUTCMilliseconds() === 0
  ) {
    const key = zonedDateKey(due);
    return { ...task, dueDate: withDateOnly(parseLocalDate(key)) };
  }
  return task;
}

function coerceCalendarTasks(list: TaskRow[]): TaskRow[] {
  return list.map(coerceCalendarTask);
}

/** Prefer the row with the newer `updatedAt` so a soft RSC refresh cannot
 *  clobber an optimistic drag before the write is visible. On a tie, keep
 *  `a` (local/prev) — stale RSC payloads often share the same timestamp. */
function preferFresherTask(a: TaskRow, b: TaskRow): TaskRow {
  const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
  const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
  if (bTime !== aTime) return bTime > aTime ? b : a;
  return a;
}

function mergeCalendarTasks(
  prev: TaskRow[],
  incoming: TaskRow[],
  pendingIds?: ReadonlySet<string>,
): TaskRow[] {
  const map = new Map<string, TaskRow>();
  for (const task of prev) map.set(task.id, task);
  for (const task of incoming) {
    if (pendingIds?.has(task.id)) continue;
    const existing = map.get(task.id);
    map.set(task.id, existing ? preferFresherTask(existing, task) : task);
  }
  return [...map.values()];
}

function withOptimisticDue(
  task: TaskRow,
  dueDate: Date,
  durationMinutes: number | null,
): TaskRow {
  return {
    ...task,
    dueDate,
    durationMinutes,
    updatedAt: new Date(),
  };
}

function isSameDay(a: Date, b: Date) {
  return toDateKey(a) === toDateKey(b);
}

function areaLabel(
  area: LifeArea,
  t: { phd: string; work: string; lifeArea: string; language: string },
) {
  if (area === "PHD") return t.phd;
  if (area === "WORK") return t.work;
  if (area === "LANG") return t.language;
  return t.lifeArea;
}

function TaskChipContent({
  task,
  overdue,
  hasDoc,
  className,
}: {
  task: TaskRow;
  overdue: boolean;
  hasDoc?: boolean;
  className?: string;
}) {
  const language = useLanguage();
  const area = taskArea(task);
  const clock =
    task.dueDate != null
      ? formatClock(
          new Date(task.dueDate),
          language === "EN" ? "EN" : "FA",
          task.durationMinutes,
        )
      : null;
  const titleWithClock = clock ? `${task.title} · ${clock}` : task.title;

  if (overdue) {
    return (
      <span
        title={titleWithClock}
        className={cn(
          "flex w-full min-h-[22px] min-w-0 items-center gap-1 truncate rounded-md border border-[var(--status-blocked-border)] px-1.5 py-[3px] text-start text-[11px] font-medium leading-4 text-[var(--status-blocked)] border-s-4",
          AREA_ACCENT[area],
          AREA_OVERDUE_WASH[area],
          task.status === "DONE" && "opacity-45 line-through",
          className,
        )}
      >
        <span className={cn("size-1.5 shrink-0 rounded-full", AREA_DOT[area])} />
        <Icon
          name="alert-triangle"
          size={11}
          className="shrink-0 text-[var(--status-blocked)]"
        />
        <span className="min-w-0 truncate">{task.title}</span>
        {clock ? (
          <span className="shrink-0 tabular-nums opacity-80">{clock}</span>
        ) : null}
        {hasDoc && <Icon name="file-text" size={10} className="shrink-0" />}
      </span>
    );
  }

  return (
    <span
      title={titleWithClock}
      className={cn(
        "flex w-full min-h-[22px] min-w-0 items-center gap-1 truncate rounded-[5px] px-1.5 py-[3px] text-start text-[11px] font-medium leading-4 shadow-[0_1px_0_rgb(0_0_0/0.04)]",
        AREA_CHIP[area],
        task.status === "DONE" && "opacity-45 line-through",
        className,
      )}
    >
      <span className="min-w-0 truncate">{task.title}</span>
      {clock ? (
        <span className="shrink-0 tabular-nums opacity-80">{clock}</span>
      ) : null}
      {hasDoc && <Icon name="file-text" size={10} className="shrink-0 opacity-90" />}
    </span>
  );
}

function DraggableChip({
  task,
  overdue,
  hasDoc,
  onOpen,
}: {
  task: TaskRow;
  overdue: boolean;
  hasDoc?: boolean;
  onOpen: () => void;
}) {
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
        "w-full min-w-0 cursor-grab active:cursor-grabbing touch-none hover:brightness-110",
        isDragging && "opacity-40",
      )}
    >
      <TaskChipContent task={task} overdue={overdue} hasDoc={hasDoc} />
    </button>
  );
}

function DroppableDay({
  date,
  inMonth,
  isToday,
  isSelected,
  isFriday,
  lastCol,
  lastRow,
  dayNumber,
  language,
  dayTasks,
  visibleCount,
  moreLabel,
  overdueLabel,
  docsByTask,
  onSelect,
  onOpenTask,
  onMore,
  tall,
}: {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isFriday: boolean;
  lastCol: boolean;
  lastRow: boolean;
  dayNumber: string;
  language: "FA" | "EN";
  dayTasks: TaskRow[];
  visibleCount: number;
  moreLabel: string;
  overdueLabel: string;
  docsByTask?: Record<string, { id: string; title: string }[]>;
  onSelect: () => void;
  onOpenTask: (task: TaskRow) => void;
  onMore: () => void;
  tall?: boolean;
}) {
  const key = toDateKey(date);
  const { setNodeRef, isOver } = useDroppable({ id: key });
  const overdueCount = dayTasks.filter(t => isOverdueTask(t)).length;
  const hasOverdue = overdueCount > 0;
  const extra = Math.max(0, dayTasks.length - visibleCount);
  const shown = dayTasks.slice(0, visibleCount);

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      dir={language === "FA" ? "rtl" : "ltr"}
      className={cn(
        "group relative h-full min-h-0 min-w-0 w-full overflow-hidden p-0 text-start transition-colors cursor-pointer",
        !lastCol && "border-e",
        !lastRow && "border-b",
        "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        !inMonth && "bg-muted/20",
        isFriday && inMonth && !hasOverdue && "bg-[var(--status-blocked-tint)]/25",
        hasOverdue && inMonth && "bg-[linear-gradient(180deg,var(--status-blocked-tint)_0%,transparent_72%)]",
        isSelected && "bg-primary/10 ring-1 ring-inset ring-primary/35",
        isOver && "bg-primary/15 ring-2 ring-inset ring-primary/50",
        tall && "min-h-[420px]",
      )}
    >
      <div className="flex h-full w-full min-w-0 flex-col items-stretch p-1">
        <div className="flex h-7 w-full shrink-0 items-center justify-between gap-1">
          <span
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-full text-[13px] font-medium",
              !inMonth && "text-muted-foreground/55",
              isToday &&
                "bg-primary text-primary-foreground font-semibold shadow-sm",
              hasOverdue &&
                !isToday &&
                inMonth &&
                "text-[var(--status-blocked)] font-semibold",
            )}
          >
            {dayNumber}
          </span>
          {hasOverdue && (
            <span
              className="inline-flex items-center gap-0.5 rounded-full border border-[var(--status-blocked-border)] bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--status-blocked)] shadow-sm backdrop-blur-sm"
              title={overdueLabel}
            >
              <Icon name="alert-triangle" size={10} />
              {formatNumber(overdueCount, language)}
            </span>
          )}
        </div>
        <div
          className={cn(
            "mt-0.5 flex min-h-0 w-full min-w-0 flex-1 flex-col items-stretch gap-[3px]",
            tall ? "overflow-y-auto" : "overflow-hidden",
          )}
        >
          {shown.map(task => (
            <DraggableChip
              key={task.id}
              task={task}
              overdue={isOverdueTask(task)}
              hasDoc={(docsByTask?.[task.id]?.length ?? 0) > 0}
              onOpen={() => onOpenTask(task)}
            />
          ))}
          {extra > 0 && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onMore();
              }}
              className="px-1 text-start text-[10px] font-medium text-primary hover:underline"
            >
              +{formatNumber(extra, language)} {moreLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface CalendarCCProps {
  tasks: TaskRow[];
  users: UserRow[];
  labels: LabelRow[];
  userProjects: ProjectRow[];
  currentUserId: string;
  currentUserRole: string;
  /** YYYY-MM-DD from the server so SSR and first client paint match. */
  initialTodayKey: string;
}

export function CalendarCC({
  tasks: initialTasks,
  users,
  labels,
  userProjects,
  currentUserId,
  currentUserRole,
  initialTodayKey,
}: CalendarCCProps) {
  const t = useTranslation();
  const language = useLanguage();
  const edit = useLifeTaskEdit();
  const asideRef = React.useRef<HTMLElement>(null);
  const mobileDefaultApplied = React.useRef(false);

  // Stable across SSR → hydrate; refresh to client-local midnight after mount.
  const [today, setToday] = React.useState(() =>
    startOfDay(parseLocalDate(initialTodayKey)),
  );
  const todayJalali = jalaliOf(today);

  // Always start as month so SSR and hydrate match (no matchMedia in useState).
  const [view, setView] = React.useState<CalendarView>("month");
  const [anchor, setAnchor] = React.useState(() =>
    startOfDay(parseLocalDate(initialTodayKey)),
  );
  const [selected, setSelected] = React.useState(() =>
    startOfDay(parseLocalDate(initialTodayKey)),
  );
  const [tasks, setTasks] = React.useState(() =>
    coerceCalendarTasks(initialTasks),
  );
  const [docsByTask, setDocsByTask] = React.useState<
    Record<string, { id: string; title: string }[]>
  >({});
  const [areaFilter, setAreaFilter] = React.useState<Set<LifeArea>>(
    () => new Set(LIFE_AREAS),
  );
  const [activeDrag, setActiveDrag] = React.useState<TaskRow | null>(null);
  const [hourDragPreview, setHourDragPreview] =
    React.useState<HourDragPreview | null>(null);
  const hourDragPreviewRef = React.useRef<HourDragPreview | null>(null);
  const loadedRanges = React.useRef(new Set<string>());
  /** Task ids with an in-flight calendar reschedule — ignore soft RSC overwrites. */
  const pendingReschedules = React.useRef(new Set<string>());
  const lastPointer = React.useRef<{ x: number; y: number } | null>(null);
  const grabOffsetPx = React.useRef(0);
  const dragDurationRef = React.useRef(60);
  const dragTitleRef = React.useRef("");
  const pointerTrackCleanup = React.useRef<(() => void) | null>(null);

  React.useEffect(() => {
    return () => {
      pointerTrackCleanup.current?.();
      pointerTrackCleanup.current = null;
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
  );

  React.useEffect(() => {
    const localToday = startOfDay();
    setToday(localToday);
    setAnchor(prev =>
      toDateKey(prev) === initialTodayKey ? localToday : prev,
    );
    setSelected(prev =>
      toDateKey(prev) === initialTodayKey ? localToday : prev,
    );
  }, [initialTodayKey]);

  React.useEffect(() => {
    if (mobileDefaultApplied.current) return;
    mobileDefaultApplied.current = true;
    if (window.matchMedia("(max-width: 767px)").matches) {
      setView("day");
    }
  }, []);

  React.useEffect(() => {
    setTasks(prev =>
      mergeCalendarTasks(
        prev,
        coerceCalendarTasks(initialTasks),
        pendingReschedules.current,
      ),
    );
  }, [initialTasks]);

  React.useEffect(() => {
    const ids = tasks.map(task => task.id);
    if (ids.length === 0) {
      setDocsByTask({});
      return;
    }
    let cancelled = false;
    void listDocsByTaskIdsAction(ids).then(map => {
      if (!cancelled) setDocsByTask(map);
    });
    return () => {
      cancelled = true;
    };
  }, [tasks]);

  const anchorJalali = jalaliOf(anchor);

  const cells = React.useMemo(
    () =>
      view === "month"
        ? jalaliMonthCells(anchorJalali.jy, anchorJalali.jm)
        : weekCells(view === "day" ? selected : anchor),
    [view, anchor, selected, anchorJalali.jy, anchorJalali.jm],
  );

  const filteredTasks = React.useMemo(
    () => tasks.filter(task => areaFilter.has(taskArea(task))),
    [tasks, areaFilter],
  );

  const byDay = React.useMemo(() => {
    const map = new Map<string, TaskRow[]>();
    for (const task of filteredTasks) {
      if (!task.dueDate) continue;
      const due = new Date(task.dueDate);
      if (Number.isNaN(due.getTime())) continue;
      const key = toDueDateKey(due, task.durationMinutes);
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }
    return map;
  }, [filteredTasks]);

  React.useEffect(() => {
    let from: Date;
    let to: Date;
    if (view === "month") {
      const bounds = jalaliMonthBounds(anchorJalali.jy, anchorJalali.jm);
      from = bounds.from;
      to = bounds.to;
    } else if (view === "day") {
      from = startOfWeek(selected);
      to = endOfWeek(selected);
    } else {
      from = startOfWeek(anchor);
      to = endOfWeek(anchor);
    }
    const rangeKey = `${toDateKey(from)}_${toDateKey(to)}`;
    if (loadedRanges.current.has(rangeKey)) return;
    loadedRanges.current.add(rangeKey);
    let cancelled = false;
    loadCalendarRange(from.toISOString(), to.toISOString()).then(next => {
      if (cancelled) return;
      setTasks(prev =>
        mergeCalendarTasks(
          prev,
          coerceCalendarTasks(next),
          pendingReschedules.current,
        ),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [view, anchor, selected, anchorJalali.jy, anchorJalali.jm]);

  const selectedTasks = byDay.get(toDateKey(selected)) ?? [];
  const selectedJalali = jalaliOf(selected);

  function go(delta: number) {
    if (view === "month") {
      setAnchor(prev => {
        const j = jalaliOf(prev);
        const n = addJalaliMonth(j.jy, j.jm, delta);
        return toGregorianDate(n.jy, n.jm, j.jd);
      });
    } else if (view === "day") {
      setSelected(prev => {
        const next = addDays(prev, delta);
        setAnchor(next);
        return next;
      });
    } else {
      setAnchor(prev => addDays(prev, delta * 7));
    }
  }

  function goToday() {
    setAnchor(today);
    setSelected(today);
  }

  function selectDay(date: Date, focusPanel = false) {
    setSelected(date);
    if (view === "week" || view === "day") setAnchor(date);
    if (focusPanel) {
      requestAnimationFrame(() => {
        asideRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
  }

  function openTaskOnDay(task: TaskRow, date: Date) {
    selectDay(date);
    void edit.openTask(task);
  }

  function toggleArea(area: LifeArea) {
    setAreaFilter(prev => {
      const next = new Set(prev);
      if (next.has(area)) {
        if (next.size === 1) return next;
        next.delete(area);
      } else {
        next.add(area);
      }
      return next;
    });
  }

  function setAllAreas() {
    setAreaFilter(new Set(LIFE_AREAS));
  }

  function clearHourDragTracking() {
    pointerTrackCleanup.current?.();
    pointerTrackCleanup.current = null;
    hourDragPreviewRef.current = null;
    setHourDragPreview(null);
  }

  function resolveHourDropAtPointer(
    clientX: number,
    clientY: number,
  ): HourDragPreview | null {
    const hit = findHoursColumnAtPoint(clientX, clientY);
    if (!hit) return null;
    const startMin = startMinutesFromPointer(
      clientY,
      hit.rect.top,
      COLUMN_HEIGHT,
      grabOffsetPx.current,
      dragDurationRef.current,
    );
    return {
      dateKey: hit.dateKey,
      startMin,
      durationMin: dragDurationRef.current,
      title: dragTitleRef.current,
    };
  }

  function updateHourPreviewFromPointer(clientX: number, clientY: number) {
    const scroller = document.querySelector(
      "[data-hour-scroll]",
    ) as HTMLElement | null;
    if (scroller) {
      const rect = scroller.getBoundingClientRect();
      const edge = 48;
      if (clientY < rect.top + edge) {
        scroller.scrollTop -= 16;
      } else if (clientY > rect.bottom - edge) {
        scroller.scrollTop += 16;
      }
    }

    // All-day strip is not an hour drop — clear the ghost so we don't flash 00:00.
    if (findAllDayAtPoint(clientX, clientY)) {
      hourDragPreviewRef.current = null;
      setHourDragPreview(null);
      return;
    }

    // Re-resolve after possible scroll so ghost matches the final grid under the finger.
    const next = resolveHourDropAtPointer(clientX, clientY);
    hourDragPreviewRef.current = next;
    setHourDragPreview(next);
  }

  function onDragStart(event: DragStartEvent) {
    const task = event.active.data.current?.task as TaskRow | undefined;
    const resolved =
      task ?? tasks.find(t => t.id === event.active.id) ?? null;
    setActiveDrag(resolved);

    const duration = Math.max(
      SNAP_MINUTES,
      resolved?.durationMinutes && resolved.durationMinutes > 0
        ? resolved.durationMinutes
        : 60,
    );
    dragDurationRef.current = duration;
    dragTitleRef.current = resolved?.title ?? "";

    const ae = event.activatorEvent;
    const initial = event.active.rect.current.initial;
    if (ae && "clientY" in ae && "clientX" in ae) {
      const pointer = ae as PointerEvent;
      lastPointer.current = { x: pointer.clientX, y: pointer.clientY };
      // Grab relative to the visible block top (viewport). Cap to block height
      // so a click near the bottom still maps sensibly if metrics glitch.
      const blockH = durationToHeight(duration);
      grabOffsetPx.current =
        initial != null
          ? Math.min(
              Math.max(0, pointer.clientY - initial.top),
              Math.max(0, blockH - 1),
            )
          : 0;
    } else {
      lastPointer.current = null;
      grabOffsetPx.current = 0;
    }

    function onPointerMove(ev: PointerEvent) {
      lastPointer.current = { x: ev.clientX, y: ev.clientY };
      updateHourPreviewFromPointer(ev.clientX, ev.clientY);
    }
    window.addEventListener("pointermove", onPointerMove);
    pointerTrackCleanup.current = () => {
      window.removeEventListener("pointermove", onPointerMove);
    };

    if (lastPointer.current) {
      updateHourPreviewFromPointer(
        lastPointer.current.x,
        lastPointer.current.y,
      );
    }
  }

  function onDragCancel() {
    clearHourDragTracking();
    setActiveDrag(null);
    lastPointer.current = null;
  }

  async function applySchedule(
    taskId: string,
    dueDateKey: string,
    time: string,
    durationMinutes: number | null | undefined,
  ) {
    const task = tasks.find(t => t.id === taskId);
    if (!task?.dueDate) return;
    const clock = parseClockTime(time);
    if (!clock || !/^\d{4}-\d{2}-\d{2}$/.test(dueDateKey)) return;
    const previousDue = task.dueDate;
    const previousDuration = task.durationMinutes ?? null;
    const nextDue = setDueDateTime(dueDateKey, clock.hours, clock.minutes);
    if (Number.isNaN(nextDue.getTime())) return;
    const nextDuration =
      durationMinutes === undefined
        ? previousDuration
        : durationMinutes != null && durationMinutes > 0
          ? Math.min(24 * 60, Math.round(durationMinutes))
          : null;

    const sameInstant =
      new Date(previousDue).getTime() === nextDue.getTime();
    const sameDuration = (previousDuration ?? null) === (nextDuration ?? null);
    if (sameInstant && sameDuration) return;

    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? withOptimisticDue(t, nextDue, nextDuration)
          : t,
      ),
    );
    setSelected(nextDue);
    edit.syncDueFromCalendar(taskId, nextDue, nextDuration ?? null);
    pendingReschedules.current.add(taskId);

    try {
      const result = await rescheduleTaskSchedule(taskId, {
        dueDateKey,
        time,
        dueAtIso: nextDue.toISOString(),
        durationMinutes: nextDuration,
        timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      });
      if (!result?.success) {
        setTasks(prev =>
          prev.map(t =>
            t.id === taskId
              ? {
                  ...t,
                  dueDate: previousDue,
                  durationMinutes: previousDuration,
                  updatedAt: new Date(),
                }
              : t,
          ),
        );
        edit.syncDueFromCalendar(taskId, new Date(previousDue), previousDuration);
        toast.error(result?.error ?? t.common.error);
      }
    } catch (error) {
      console.error("rescheduleTaskSchedule failed", error);
      setTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? {
                ...t,
                dueDate: previousDue,
                durationMinutes: previousDuration,
                updatedAt: new Date(),
              }
            : t,
        ),
      );
      edit.syncDueFromCalendar(taskId, new Date(previousDue), previousDuration);
      toast.error(t.common.error);
    } finally {
      pendingReschedules.current.delete(taskId);
    }
  }

  function onResizePreview(taskId: string, durationMinutes: number) {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, durationMinutes } : t)),
    );
  }

  async function onResizeCommit(taskId: string, durationMinutes: number) {
    const task = tasks.find(t => t.id === taskId);
    if (!task?.dueDate) return;
    const due = new Date(task.dueDate);
    if (Number.isNaN(due.getTime())) return;
    const previousDuration = task.durationMinutes ?? null;
    const dueDateKey = toDateKey(due);
    const time = `${String(due.getHours()).padStart(2, "0")}:${String(due.getMinutes()).padStart(2, "0")}`;
    const nextDuration = Math.min(
      24 * 60,
      Math.max(SNAP_MINUTES, Math.round(durationMinutes)),
    );
    if ((previousDuration ?? null) === nextDuration) return;

    setTasks(prev =>
      prev.map(t =>
        t.id === taskId ? withOptimisticDue(t, due, nextDuration) : t,
      ),
    );
    edit.syncDueFromCalendar(taskId, due, nextDuration);
    pendingReschedules.current.add(taskId);

    try {
      const result = await rescheduleTaskSchedule(taskId, {
        dueDateKey,
        time,
        dueAtIso: due.toISOString(),
        durationMinutes: nextDuration,
        timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      });
      if (!result?.success) {
        setTasks(prev =>
          prev.map(t =>
            t.id === taskId
              ? {
                  ...t,
                  durationMinutes: previousDuration,
                  updatedAt: new Date(),
                }
              : t,
          ),
        );
        edit.syncDueFromCalendar(taskId, due, previousDuration);
        toast.error(result?.error ?? t.common.error);
      }
    } catch (error) {
      console.error("rescheduleTaskSchedule resize failed", error);
      setTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? {
                ...t,
                durationMinutes: previousDuration,
                updatedAt: new Date(),
              }
            : t,
        ),
      );
      edit.syncDueFromCalendar(taskId, due, previousDuration);
      toast.error(t.common.error);
    } finally {
      pendingReschedules.current.delete(taskId);
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    const pointer = lastPointer.current;
    const grab = grabOffsetPx.current;
    // Prefer a fresh geometry resolve over React state (state can lag one frame).
    const live =
      pointer != null
        ? resolveHourDropAtPointer(pointer.x, pointer.y)
        : null;
    const preview = live ?? hourDragPreviewRef.current;

    const { active, over } = event;
    const taskId = String(active.id);
    const task = tasks.find(t => t.id === taskId);
    if (!task?.dueDate) {
      clearHourDragTracking();
      setActiveDrag(null);
      lastPointer.current = null;
      return;
    }

    const duration = Math.max(
      SNAP_MINUTES,
      task.durationMinutes && task.durationMinutes > 0
        ? task.durationMinutes
        : 60,
    );

    const overId = over ? String(over.id) : "";
    const overData = over?.data.current as
      | { type?: string; dateKey?: string }
      | undefined;

    // 1) Explicit all-day (geometry or dnd-kit) — before hour preview, which
    //    used to steal drops when the pointer sat above the hours column.
    const allDayKey =
      (pointer ? findAllDayAtPoint(pointer.x, pointer.y) : null) ??
      (overData?.type === "allDay" ? overData.dateKey : null) ??
      null;

    if (allDayKey) {
      const movePromise = commitDayMove(taskId, task, allDayKey, "");
      clearHourDragTracking();
      setActiveDrag(null);
      lastPointer.current = null;
      await movePromise;
      return;
    }

  // 2) Hour grid — only in week/day views (month has no hour columns; a
  //    stale preview must not steal the drop and invent a timed schedule).
  if (preview && view !== "month") {
    const schedulePromise = applySchedule(
      taskId,
      preview.dateKey,
      formatMinutesClock(preview.startMin),
      duration,
    );
    clearHourDragTracking();
    setActiveDrag(null);
    lastPointer.current = null;
    await schedulePromise;
    return;
  }

  if (!over) {
    clearHourDragTracking();
    setActiveDrag(null);
    lastPointer.current = null;
    return;
  }

  const hoursKey = parseHoursDropId(overId);

  if (hoursKey || overData?.type === "hours") {
    const dueDateKey = hoursKey ?? overData?.dateKey;
    if (!dueDateKey) {
      clearHourDragTracking();
      setActiveDrag(null);
      lastPointer.current = null;
      return;
    }
    const el = document.querySelector(
      `[data-day-hours="${dueDateKey}"]`,
    ) as HTMLElement | null;
    const rect = el?.getBoundingClientRect();
    let startMin =
      new Date(task.dueDate).getHours() * 60 +
      new Date(task.dueDate).getMinutes();
    if (rect && pointer) {
      startMin = startMinutesFromPointer(
        pointer.y,
        rect.top,
        COLUMN_HEIGHT,
        grab,
        duration,
      );
    }
    const schedulePromise = applySchedule(
      taskId,
      dueDateKey,
      formatMinutesClock(startMin),
      duration,
    );
    clearHourDragTracking();
    setActiveDrag(null);
    lastPointer.current = null;
    await schedulePromise;
    return;
  }

    // 3) Month cell / plain day drop — keep clock when moving days.
    let dueDateKey: string | null = null;
    let time: string | null | undefined = undefined;

    if (/^\d{4}-\d{2}-\d{2}$/.test(overId)) {
      dueDateKey = overId;
      time = undefined;
    } else {
      clearHourDragTracking();
      setActiveDrag(null);
      lastPointer.current = null;
      return;
    }

    const movePromise = commitDayMove(taskId, task, dueDateKey, time);
    clearHourDragTracking();
    setActiveDrag(null);
    lastPointer.current = null;
    await movePromise;
  }

  async function commitDayMove(
    taskId: string,
    task: TaskRow,
    dueDateKey: string,
    time: string | null | undefined,
  ) {
    const previousDue = task.dueDate!;
    const previousDuration = task.durationMinutes ?? null;

    let nextDue: Date;
    let nextDuration = previousDuration;
    if (time === "") {
      nextDue = withDateOnly(parseLocalDate(dueDateKey));
      nextDuration = null;
    } else {
      nextDue = moveDueToDay(task.dueDate, dueDateKey, task.durationMinutes);
    }

    if (
      new Date(previousDue).getTime() === nextDue.getTime() &&
      (previousDuration ?? null) === (nextDuration ?? null)
    ) {
      return;
    }

    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? withOptimisticDue(t, nextDue, nextDuration)
          : t,
      ),
    );
    setSelected(nextDue);
    edit.syncDueFromCalendar(taskId, nextDue, nextDuration);
    pendingReschedules.current.add(taskId);

    try {
      const result = await rescheduleTaskDueDate({
        taskId,
        dueDateKey,
        time: time ?? null,
        dueAtIso: nextDue.toISOString(),
        timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      });
      if (!result?.success) {
        setTasks(prev =>
          prev.map(t =>
            t.id === taskId
              ? {
                  ...t,
                  dueDate: previousDue,
                  durationMinutes: previousDuration,
                  updatedAt: new Date(),
                }
              : t,
          ),
        );
        edit.syncDueFromCalendar(taskId, new Date(previousDue), previousDuration);
        toast.error(result?.error || t.common.error);
      }
    } catch (error) {
      console.error("rescheduleTaskDueDate failed", error);
      setTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? {
                ...t,
                dueDate: previousDue,
                durationMinutes: previousDuration,
                updatedAt: new Date(),
              }
            : t,
        ),
      );
      edit.syncDueFromCalendar(taskId, new Date(previousDue), previousDuration);
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : t.common.error,
      );
    } finally {
      pendingReschedules.current.delete(taskId);
    }
  }

  const weekdays = language === "FA" ? PERSIAN_WEEKDAYS_SAT : WEEKDAYS_EN;
  const titleLabel =
    view === "month"
      ? formatJalaliMonthYear(anchorJalali.jy, anchorJalali.jm, language)
      : view === "day"
        ? formatJalaliDate(selected, language)
        : formatJalaliWeekRange(anchor, language);

  const userOptions = [
    { value: "", label: t.tasks.unassigned },
    ...users.map(usr => ({ value: usr.id, label: usr.name })),
  ];
  const statusFieldOptions = STATUS_OPTIONS.map(o => ({
    value: o.value,
    label: t.tasks[o.labelKey as keyof typeof t.tasks] as string,
  }));
  const priorityFieldOptions = PRIORITY_OPTIONS.map(o => ({
    value: o.value,
    label: t.tasks[o.labelKey as keyof typeof t.tasks] as string,
  }));

  return (
    <>
      <div className="flex flex-col gap-3 min-h-[calc(100dvh-3rem)]">
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <h1 className="text-xl font-semibold">{t.life.calendarTitle}</h1>
          <div className="flex items-center gap-0.5 rounded-lg border p-0.5 overflow-x-auto max-w-full">
            <Button
              size="sm"
              variant={view === "month" ? "primary" : "ghost"}
              className="shrink-0"
              onClick={() => setView("month")}
            >
              {t.life.monthView}
            </Button>
            <Button
              size="sm"
              variant={view === "week" ? "primary" : "ghost"}
              className="shrink-0"
              onClick={() => {
                setView("week");
                setAnchor(selected);
              }}
            >
              {t.life.weekView}
            </Button>
            <Button
              size="sm"
              variant={view === "day" ? "primary" : "ghost"}
              className="shrink-0"
              onClick={() => {
                setView("day");
                setAnchor(selected);
              }}
            >
              {t.life.dayView}
            </Button>
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <IconButton
              icon={language === "FA" ? "chevron-right" : "chevron-left"}
              aria-label={
                view === "month"
                  ? t.life.previousMonth
                  : view === "day"
                    ? t.life.previousDay
                    : t.life.previousWeek
              }
              onClick={() => go(-1)}
            />
            <h2 className="min-w-0 flex-1 sm:min-w-48 text-center text-base sm:text-lg font-semibold tracking-tight truncate">
              {titleLabel}
            </h2>
            <IconButton
              icon={language === "FA" ? "chevron-left" : "chevron-right"}
              aria-label={
                view === "month"
                  ? t.life.nextMonth
                  : view === "day"
                    ? t.life.nextDay
                    : t.life.nextWeek
              }
              onClick={() => go(1)}
            />
          </div>
          <Button size="sm" variant="subtle" onClick={goToday}>
            {t.life.calendarToday}
          </Button>
          <div className="flex flex-wrap items-center gap-1.5 ms-auto text-xs">
            <button
              type="button"
              onClick={setAllAreas}
              className={cn(
                "rounded-md border px-2 py-1 transition-colors",
                areaFilter.size === LIFE_AREAS.length
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              {t.life.filterAll}
            </button>
            {LIFE_AREAS.map(area => {
              const active = areaFilter.has(area);
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleArea(area)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 transition-colors",
                    active
                      ? "border-foreground/20 bg-card text-foreground"
                      : "opacity-40 hover:opacity-70",
                  )}
                >
                  <span className={cn("size-2.5 rounded-full", AREA_DOT[area])} />
                  {areaLabel(area, t.life)}
                </button>
              );
            })}
            <span className="ms-1 inline-flex items-center gap-1.5 rounded-full border border-[var(--status-blocked-border)] bg-[var(--status-blocked-tint)] px-2 py-1 text-[var(--status-blocked)]">
              <Icon name="alert-triangle" size={11} />
              {t.life.overdue}
            </span>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={calendarCollision}
          onDragStart={onDragStart}
          onDragCancel={onDragCancel}
          onDragEnd={onDragEnd}
        >
          <div className="grid xl:grid-cols-[minmax(0,1fr)_min(100%,300px)] gap-3 sm:gap-4 flex-1 min-h-0">
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col min-h-[18rem] sm:min-h-[640px] xl:min-h-0 xl:h-full">
              {view === "week" || view === "day" ? (
                <WeekHourGrid
                  cells={cells}
                  byDay={byDay}
                  selected={selected}
                  today={today}
                  weekdays={weekdays}
                  language={language}
                  mode={view === "day" ? "day" : "week"}
                  dragPreview={hourDragPreview}
                  onSelectDay={date => selectDay(date)}
                  onOpenTask={(task, date) => openTaskOnDay(task, date)}
                  onResizePreview={onResizePreview}
                  onResizeCommit={onResizeCommit}
                />
              ) : (
                <>
              <div className="grid grid-cols-7 border-b bg-muted/30">
                {weekdays.map((day, index) => (
                  <div
                    key={day}
                    className={cn(
                      "px-2 py-2 text-center text-[11px] font-medium tracking-wide text-muted-foreground",
                      index === 6 && "text-[var(--status-blocked)]",
                    )}
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div
                className={cn(
                  "grid grid-cols-7 flex-1 min-h-0",
                  "grid-rows-[repeat(6,minmax(4.25rem,1fr))] sm:grid-rows-[repeat(6,minmax(108px,1fr))]",
                )}
              >
                {cells.map((date, index) => {
                  const jalali = jalaliOf(date);
                  const inMonth = jalali.jm === anchorJalali.jm;
                  const key = toDateKey(date);
                  const dayTasks = byDay.get(key) ?? [];
                  const lastCol = index % 7 === 6;
                  const lastRow = index >= cells.length - 7;

                  return (
                    <DroppableDay
                      key={key}
                      date={date}
                      inMonth={inMonth}
                      isToday={isSameDay(date, today)}
                      isSelected={isSameDay(date, selected)}
                      isFriday={date.getDay() === 5}
                      lastCol={lastCol}
                      lastRow={lastRow}
                      dayNumber={formatNumber(jalali.jd, language)}
                      language={language}
                      dayTasks={dayTasks}
                      visibleCount={3}
                      moreLabel={t.life.calendarMore}
                      overdueLabel={t.life.overdue}
                      docsByTask={docsByTask}
                      onSelect={() => selectDay(date)}
                      onOpenTask={task => openTaskOnDay(task, date)}
                      onMore={() => selectDay(date, true)}
                    />
                  );
                })}
              </div>
                </>
              )}
            </div>

            <aside
              ref={asideRef}
              className="rounded-2xl border bg-card shadow-sm p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 min-h-0 min-w-0"
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "size-11 sm:size-12 shrink-0 rounded-2xl border flex items-center justify-center text-lg font-semibold",
                    isSameDay(selected, today) &&
                      "bg-primary text-primary-foreground border-primary",
                  )}
                >
                  {formatNumber(selectedJalali.jd, language)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {t.life.selectedDay}
                  </p>
                  <h3 className="text-base font-semibold leading-snug mt-0.5 truncate">
                    {formatJalaliDate(selected, language)}
                  </h3>
                </div>
              </div>
              <CapturePageDate dueDate={toDateKey(selected)} />
              <QuickCapture compact dueDate={toDateKey(selected)} />
              <div className="flex-1 min-h-0 min-w-0 overflow-auto">
                <LifeTaskList
                  tasks={selectedTasks}
                  empty={t.life.calendarEmpty}
                  compact
                  onTaskClick={task => void edit.openTask(task)}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                />
              </div>
            </aside>
          </div>
          <DragOverlay dropAnimation={null}>
            {activeDrag && !hourDragPreview ? (
              <div className="w-40 cursor-grabbing opacity-95 shadow-lg">
                <TaskChipContent
                  task={activeDrag}
                  overdue={isOverdueTask(activeDrag)}
                  hasDoc={(docsByTask[activeDrag.id]?.length ?? 0) > 0}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <EditTaskDrawer
        open={!!edit.editingTaskId}
        onClose={edit.closeDrawer}
        isPending={edit.isPending}
        isLoadingDetail={edit.isLoadingDetail}
        actionError={edit.actionError}
        control={edit.editForm.control}
        setValue={edit.editForm.setValue}
        labels={labels}
        selectedLabelIds={edit.selectedLabelIds}
        onLabelToggle={edit.toggleLabel}
        activeTask={edit.activeTask}
        users={users}
        projects={userProjects}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        onSubmit={edit.onEditSubmit}
        statusFieldOptions={statusFieldOptions}
        priorityFieldOptions={priorityFieldOptions}
        userOptions={userOptions}
        preset="life"
      />
    </>
  );
}
