"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  closestCenter,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
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
import {
  LIFE_AREAS,
  PERSIAN_WEEKDAYS_SAT,
  addDays,
  addJalaliMonth,
  endOfWeek,
  formatJalaliDate,
  formatJalaliMonthYear,
  formatJalaliWeekRange,
  isOverdueTask,
  jalaliMonthBounds,
  jalaliMonthCells,
  jalaliOf,
  parseLocalDate,
  startOfDay,
  startOfWeek,
  toDateKey,
  toGregorianDate,
  weekCells,
  coerceLifeArea,
} from "@/lib/life";
import {
  loadCalendarRange,
  rescheduleTaskDueDate,
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

const AREA_CHIP: Record<LifeArea, string> = {
  PHD: "bg-[var(--status-review)] text-white",
  WORK: "bg-[var(--status-in-progress)] text-white",
  LIFE: "bg-[var(--status-todo)] text-white",
  LANG: "bg-emerald-600 text-white",
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
  PHD: "bg-[var(--status-review)]",
  WORK: "bg-[var(--status-in-progress)]",
  LIFE: "bg-[var(--status-todo)]",
  LANG: "bg-emerald-600",
};

const WEEKDAYS_EN = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

type CalendarView = "month" | "week";

function taskArea(task: TaskRow): LifeArea {
  return coerceLifeArea(task.area);
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
  const area = taskArea(task);

  if (overdue) {
    return (
      <span
        title={task.title}
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
        {hasDoc && <Icon name="file-text" size={10} className="shrink-0" />}
      </span>
    );
  }

  return (
    <span
      title={task.title}
      className={cn(
        "flex w-full min-h-[22px] min-w-0 items-center gap-1 truncate rounded-[5px] px-1.5 py-[3px] text-start text-[11px] font-medium leading-4 shadow-[0_1px_0_rgb(0_0_0/0.04)]",
        AREA_CHIP[area],
        task.status === "DONE" && "opacity-45 line-through",
        className,
      )}
    >
      <span className="min-w-0 truncate">{task.title}</span>
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
  const today = startOfDay();
  const overdueCount = dayTasks.filter(t => isOverdueTask(t, today)).length;
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
              overdue={isOverdueTask(task, today)}
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
}

export function CalendarCC({
  tasks: initialTasks,
  users,
  labels,
  userProjects,
  currentUserId,
  currentUserRole,
}: CalendarCCProps) {
  const t = useTranslation();
  const language = useLanguage();
  const today = startOfDay();
  const todayJalali = jalaliOf(today);
  const edit = useLifeTaskEdit();
  const asideRef = React.useRef<HTMLElement>(null);

  const [view, setView] = React.useState<CalendarView>("month");
  const [anchor, setAnchor] = React.useState(today);
  const [selected, setSelected] = React.useState<Date>(today);
  const [tasks, setTasks] = React.useState(initialTasks);
  const [docsByTask, setDocsByTask] = React.useState<
    Record<string, { id: string; title: string }[]>
  >({});
  const [areaFilter, setAreaFilter] = React.useState<Set<LifeArea>>(
    () => new Set(["WORK", "LIFE"]),
  );
  const [activeDrag, setActiveDrag] = React.useState<TaskRow | null>(null);
  const loadedRanges = React.useRef(new Set<string>());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  React.useEffect(() => {
    setTasks(initialTasks);
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
        : weekCells(anchor),
    [view, anchor, anchorJalali.jy, anchorJalali.jm],
  );

  const filteredTasks = React.useMemo(
    () => tasks.filter(task => areaFilter.has(taskArea(task))),
    [tasks, areaFilter],
  );

  const byDay = React.useMemo(() => {
    const map = new Map<string, TaskRow[]>();
    for (const task of filteredTasks) {
      if (!task.dueDate) continue;
      const key = toDateKey(new Date(task.dueDate));
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
      setTasks(prev => {
        const ids = new Set(prev.map(task => task.id));
        const extra = next.filter(task => !ids.has(task.id));
        return extra.length ? [...prev, ...extra] : prev;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [view, anchor, anchorJalali.jy, anchorJalali.jm]);

  const selectedTasks = byDay.get(toDateKey(selected)) ?? [];
  const selectedJalali = jalaliOf(selected);
  const visibleCount = view === "month" ? 3 : 20;

  function go(delta: number) {
    if (view === "month") {
      setAnchor(prev => {
        const j = jalaliOf(prev);
        const n = addJalaliMonth(j.jy, j.jm, delta);
        return toGregorianDate(n.jy, n.jm, j.jd);
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
    if (view === "week") setAnchor(date);
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

  function onDragStart(event: DragStartEvent) {
    const task = event.active.data.current?.task as TaskRow | undefined;
    setActiveDrag(task ?? tasks.find(t => t.id === event.active.id) ?? null);
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;
    const taskId = String(active.id);
    const dueDateKey = String(over.id);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDateKey)) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task?.dueDate) return;
    if (toDateKey(new Date(task.dueDate)) === dueDateKey) return;

    const previousDue = task.dueDate;
    const nextDue = parseLocalDate(dueDateKey);
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, dueDate: nextDue } : t)),
    );
    setSelected(nextDue);

    const result = await rescheduleTaskDueDate(taskId, dueDateKey);
    if (!result.success) {
      setTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, dueDate: previousDue } : t)),
      );
    }
  }

  const weekdays = language === "FA" ? PERSIAN_WEEKDAYS_SAT : WEEKDAYS_EN;
  const titleLabel =
    view === "month"
      ? formatJalaliMonthYear(anchorJalali.jy, anchorJalali.jm, language)
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
          <div className="flex items-center gap-1 rounded-lg border p-0.5">
            <Button
              size="sm"
              variant={view === "month" ? "primary" : "ghost"}
              onClick={() => setView("month")}
            >
              {t.life.monthView}
            </Button>
            <Button
              size="sm"
              variant={view === "week" ? "primary" : "ghost"}
              onClick={() => {
                setView("week");
                setAnchor(selected);
              }}
            >
              {t.life.weekView}
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <IconButton
              icon={language === "FA" ? "chevron-right" : "chevron-left"}
              aria-label={
                view === "month" ? t.life.previousMonth : t.life.previousWeek
              }
              onClick={() => go(-1)}
            />
            <h2 className="min-w-48 text-center text-lg font-semibold tracking-tight">
              {titleLabel}
            </h2>
            <IconButton
              icon={language === "FA" ? "chevron-left" : "chevron-right"}
              aria-label={view === "month" ? t.life.nextMonth : t.life.nextWeek}
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
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="grid xl:grid-cols-[minmax(0,1fr)_300px] gap-4 flex-1 min-h-0">
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col min-h-[22rem] sm:min-h-[640px] xl:min-h-0 xl:h-full">
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
                  view === "month"
                    ? "grid-rows-[repeat(6,minmax(4.25rem,1fr))] sm:grid-rows-[repeat(6,minmax(108px,1fr))]"
                    : "grid-rows-1 min-h-[18rem] sm:min-h-[480px]",
                )}
              >
                {cells.map((date, index) => {
                  const jalali = jalaliOf(date);
                  const inMonth =
                    view === "week" || jalali.jm === anchorJalali.jm;
                  const key = toDateKey(date);
                  const dayTasks = byDay.get(key) ?? [];
                  const lastCol = index % 7 === 6;
                  const lastRow =
                    view === "week" ? true : index >= cells.length - 7;

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
                      visibleCount={visibleCount}
                      moreLabel={t.life.calendarMore}
                      overdueLabel={t.life.overdue}
                      docsByTask={docsByTask}
                      tall={view === "week"}
                      onSelect={() => selectDay(date)}
                      onOpenTask={task => openTaskOnDay(task, date)}
                      onMore={() => selectDay(date, true)}
                    />
                  );
                })}
              </div>
            </div>

            <aside
              ref={asideRef}
              className="rounded-2xl border bg-card shadow-sm p-4 flex flex-col gap-4 min-h-0"
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "size-12 shrink-0 rounded-2xl border flex items-center justify-center text-lg font-semibold",
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
                  <h3 className="text-base font-semibold leading-snug mt-0.5">
                    {formatJalaliDate(selected, language)}
                  </h3>
                </div>
              </div>
              <CapturePageDate dueDate={toDateKey(selected)} />
              <QuickCapture compact dueDate={toDateKey(selected)} />
              <div className="flex-1 min-h-0 overflow-auto">
                <LifeTaskList
                  tasks={selectedTasks}
                  empty={t.life.calendarEmpty}
                  onTaskClick={task => void edit.openTask(task)}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                />
              </div>
            </aside>
          </div>
          <DragOverlay dropAnimation={null}>
            {activeDrag ? (
              <div className="w-40 cursor-grabbing opacity-95 shadow-lg">
                <TaskChipContent
                  task={activeDrag}
                  overdue={isOverdueTask(activeDrag, today)}
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
