"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { QuickCapture } from "@/components/life/quick-capture";
import { CapturePageDate } from "@/components/life/capture-provider";
import { LifeTaskList } from "@/components/life/life-task-list";
import { TodayFocusSlots } from "@/components/life/today-focus-slots";
import { HabitsPanel } from "@/components/life/habits-panel";
import {
  FocusSessionCard,
  FocusSessionLauncher,
  FocusSessionProvider,
} from "@/components/life/focus-session";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import { usePersonalTaskEditor } from "@/components/life/use-personal-task-editor";
import type { HabitItem } from "@/features/habits/actions";
import {
  moveYesterdayToToday,
  setTodayFocus,
  toggleTodayFocus,
  completePersonalTask,
} from "@/features/life/actions";
import { isTodayFocusCandidate } from "@/features/life/focus-slots";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { openDailyNoteAction } from "@/features/docs/actions";
import {
  formatJalaliDate,
  formatJalaliShort,
  PERSIAN_WEEKDAYS_SAT,
} from "@/lib/life";
import { formatNumber, cn } from "@/lib/utils";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { Button } from "@/components/ui-kit/forms/button";
import type { WeekDayStripItem } from "@/features/life/queries";
import type { TaskRow } from "@/features/tasks/types";
import type { UserRow } from "@/features/users/types";
import type { LabelRow } from "@/features/labels/types";
import type { ProjectRow } from "@/features/projects/types";
import type { LifeArea } from "@/types/db";

type SideTab = "inbox" | "overdue" | "week";

interface DashboardCCProps {
  userName: string;
  areas: { id: string; name: string; area: LifeArea | null; openTasks: number }[];
  overdue: TaskRow[];
  today: TaskRow[];
  week: TaskRow[];
  inbox: TaskRow[];
  yesterdayLeftover: TaskRow[];
  focusTasks: (TaskRow | null)[];
  focusIds: string[];
  focusCandidates: TaskRow[];
  weekDays: WeekDayStripItem[];
  hoursThisWeek: number;
  doneThisWeek: number;
  todayKey: string;
  attention: {
    vocabDue: number;
    langWeekMinutes: number;
    langWeeklyGoal: number;
    hasLangGoal: boolean;
    sourcesToRead: number;
    phdDrafting: number;
  };
  attentionModules: {
    language: boolean;
    research: boolean;
  };
  habits?: HabitItem[];
  showOnboarding?: boolean;
  users: UserRow[];
  labels: LabelRow[];
  userProjects: ProjectRow[];
  currentUserId: string;
  currentUserRole: string;
}

function formatWeekHours(hours: number) {
  const coarse = hours.toFixed(1);
  if (hours > 0 && coarse === "0.0") return hours.toFixed(2);
  return coarse;
}

function countPhrase(n: number, one: string, many: string, language: "FA" | "EN") {
  const template = n === 1 ? one : many;
  return template.replace("{n}", formatNumber(n, language));
}

function AttentionToday({
  overdueCount,
  attention,
  modules,
  onOverdue,
}: {
  overdueCount: number;
  attention: DashboardCCProps["attention"];
  modules: DashboardCCProps["attentionModules"];
  onOverdue: () => void;
}) {
  const t = useTranslation();
  const language = useLanguage();
  const langLeft = Math.max(0, attention.langWeeklyGoal - attention.langWeekMinutes);
  const chipClass =
    "inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const chips: { key: string; node: React.ReactNode }[] = [];

  if (overdueCount > 0) {
    chips.push({
      key: "overdue",
      node: (
        <button type="button" onClick={onOverdue} className={chipClass}>
          <span className="size-2 rounded-full bg-red-500" />
          {countPhrase(overdueCount, t.dashboard.attentionOverdueOne, t.dashboard.attentionOverdue, language)}
        </button>
      ),
    });
  }
  if (modules.language && attention.vocabDue > 0) {
    chips.push({
      key: "vocab",
      node: (
        <Link href="/language?tab=vocab" className={chipClass}>
          <span className="size-2 rounded-full bg-violet-500" />
          {countPhrase(attention.vocabDue, t.dashboard.attentionVocabOne, t.dashboard.attentionVocab, language)}
        </Link>
      ),
    });
  }
  if (modules.research && attention.sourcesToRead > 0) {
    chips.push({
      key: "sources",
      node: (
        <Link href="/research" className={chipClass}>
          <span className="size-2 rounded-full bg-blue-500" />
          {countPhrase(attention.sourcesToRead, t.dashboard.attentionSourceOne, t.dashboard.attentionSources, language)}
        </Link>
      ),
    });
  }
  if (modules.language && attention.hasLangGoal && langLeft > 0) {
    chips.push({
      key: "lang",
      node: (
        <Link href="/language" className={chipClass}>
          <span className="size-2 rounded-full bg-emerald-500" />
          {countPhrase(langLeft, t.dashboard.attentionLangOne, t.dashboard.attentionLangGoal, language)}
        </Link>
      ),
    });
  }

  return (
    <section className="rounded-xl border bg-card px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground mb-2">{t.dashboard.attentionTitle}</p>
      {chips.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          <span className="text-emerald-600 dark:text-emerald-400">✓</span>{" "}
          {t.dashboard.attentionClear}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {chips.map(chip => (
            <React.Fragment key={chip.key}>{chip.node}</React.Fragment>
          ))}
        </div>
      )}
    </section>
  );
}

function BarRow({
  label,
  value,
  max,
  tone = "primary",
}: {
  label: string;
  value: number;
  max: number;
  tone?: "primary" | "danger" | "success" | "muted";
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const bar =
    tone === "danger"
      ? "bg-destructive"
      : tone === "success"
        ? "bg-emerald-600"
        : tone === "muted"
          ? "bg-muted-foreground/40"
          : "bg-primary";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="truncate text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums text-foreground">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-bg-sunken overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", bar)}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

export function DashboardCC({
  userName,
  areas,
  overdue,
  today,
  week,
  inbox,
  yesterdayLeftover,
  focusTasks,
  focusIds,
  focusCandidates,
  weekDays,
  hoursThisWeek,
  doneThisWeek,
  todayKey,
  attention,
  attentionModules,
  habits = [],
  showOnboarding = false,
  users,
  labels,
  userProjects,
  currentUserId,
  currentUserRole,
}: DashboardCCProps) {
  const t = useTranslation();
  const language = useLanguage();
  const router = useRouter();
  const [sideTab, setSideTab] = React.useState<SideTab>(
    overdue.length > 0 ? "overdue" : inbox.length > 0 ? "inbox" : "week",
  );
  const [draggingTitle, setDraggingTitle] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  const pinnedOpen = focusTasks.filter(task => task && task.status !== "DONE").length;
  const pinnedDone = focusTasks.filter(task => task?.status === "DONE").length;
  const [writingPending, setWritingPending] = React.useState(false);

  const { openTask, drawer } = usePersonalTaskEditor({
    users,
    labels,
    userProjects,
    currentUserId,
    currentUserRole,
  });

  const listProps = {
    onTaskClick: openTask,
    currentUserId,
    currentUserRole,
    compact: true,
    focusIds,
    onToggleFocus: (task: TaskRow) => {
      startTransition(async () => {
        const result = await toggleTodayFocus(task.id);
        if (!result.success) {
          toast.error(result.error ?? t.dashboard.focusFull);
          return;
        }
        router.refresh();
      });
    },
  };

  const weekdayLabels =
    language === "EN"
      ? ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]
      : PERSIAN_WEEKDAYS_SAT;

  function placeFocus(index: number, taskId: string | null) {
    const next = [0, 1, 2].map(slot => focusTasks[slot]?.id ?? "");
    if (taskId) {
      const from = next.indexOf(taskId);
      if (from === index) return;
      if (from >= 0) next[from] = "";
      next[index] = taskId;
    } else {
      next[index] = "";
    }
    startTransition(async () => {
      const result = await setTodayFocus(next);
      if (!result.success) {
        toast.error(result.error ?? t.common.error);
        return;
      }
      router.refresh();
    });
  }

  function onFocusDragStart(event: DragStartEvent) {
    const id = String(event.active.id).replace(/^task:/, "");
    const task = [...focusTasks, ...today, ...overdue, ...week, ...inbox].find(
      item => item?.id === id,
    );
    setDraggingTitle(task?.title ?? null);
  }

  function onFocusDragEnd(event: DragEndEvent) {
    setDraggingTitle(null);
    const overId = event.over ? String(event.over.id) : "";
    if (!overId.startsWith("focus:")) return;
    const index = Number(overId.slice("focus:".length));
    const activeId = String(event.active.id);
    if (!activeId.startsWith("task:") || Number.isNaN(index)) return;
    const taskId = activeId.slice("task:".length);
    const task = [...focusTasks, ...today, ...overdue, ...week, ...inbox].find(
      item => item?.id === taskId,
    );
    const alreadyPinned = focusTasks.some(item => item?.id === taskId);
    if (task && !alreadyPinned && !isTodayFocusCandidate(task, todayKey)) {
      toast.error(t.dashboard.focusPickLimit);
      return;
    }
    placeFocus(index, taskId);
  }

  function onMoveYesterday() {
    startTransition(async () => {
      const result = await moveYesterdayToToday();
      if (!result.success) {
        toast.error(result.error ?? t.common.error);
        return;
      }
      toast.success(
        `${result.data?.moved ?? 0} ${t.dashboard.yesterdayMoved}`,
      );
      router.refresh();
    });
  }

  async function openDaily() {
    setWritingPending(true);
    const result = await openDailyNoteAction({ language });
    setWritingPending(false);
    if (result.success && result.data?.id) {
      router.push(`/docs?id=${result.data.id}`);
    }
  }

  const sideTabs: { id: SideTab; label: string; count: number }[] = [
    { id: "inbox", label: t.dashboard.tabInbox, count: inbox.length },
    { id: "overdue", label: t.dashboard.tabOverdue, count: overdue.length },
    { id: "week", label: t.dashboard.tabWeek, count: week.length },
  ];

  const sideTasks = (
    sideTab === "inbox" ? inbox : sideTab === "overdue" ? overdue : week
  ).filter(task => !today.some(item => item.id === task.id));

  const sideEmpty =
    sideTab === "inbox"
      ? t.dashboard.noInbox
      : sideTab === "overdue"
        ? t.dashboard.noOverdue
        : t.dashboard.noTasksThisWeek;

  const sessionTasks = React.useMemo(() => {
    const seen = new Set<string>();
    const rows: TaskRow[] = [];
    for (const task of [...focusTasks, ...focusCandidates]) {
      if (!task || task.status === "DONE" || seen.has(task.id)) continue;
      seen.add(task.id);
      rows.push(task);
    }
    return rows;
  }, [focusTasks, focusCandidates]);

  const weekMax = Math.max(1, ...weekDays.map(d => d.count));
  const areaMax = Math.max(1, ...areas.map(a => a.openTasks));
  const loadMax = Math.max(
    1,
    overdue.length,
    today.length + pinnedOpen,
    inbox.length,
    week.length,
    doneThisWeek,
  );

  return (
    <FocusSessionProvider tasks={sessionTasks}>
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {formatJalaliDate(new Date(), language)}
            </p>
            <h1 className="text-xl font-semibold text-text-primary mt-0.5">
              {t.dashboard.welcome}، {userName}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FocusSessionLauncher />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/review")}
            >
              {t.dashboard.openReview}
            </Button>
          </div>
        </div>

        <AttentionToday
          overdueCount={overdue.length}
          attention={attention}
          modules={attentionModules}
          onOverdue={() => {
            setSideTab("overdue");
            document.getElementById("today-side-lists")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
        />

        <div className="grid items-start gap-4 lg:grid-cols-2">
          <div className="order-1 flex min-w-0 flex-col gap-4">
        <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day, i) => (
                <Link
                  key={day.dateKey}
                  href="/calendar"
                  className={cn(
                    "min-w-0 rounded-md border border-border-default bg-bg-surface px-0.5 py-1.5 text-center hover:bg-bg-hover transition-colors",
                    day.isToday && "border-primary bg-primary/5",
                    day.isPast && !day.isToday && "opacity-70",
                  )}
                >
                  <div className="text-[10px] text-muted-foreground truncate">
                    {weekdayLabels[i]}
                  </div>
                  <div className="text-xs font-medium leading-tight mt-0.5">
                    {formatJalaliShort(day.date, language).split(" ")[0]}
                  </div>
                  <div
                    className={cn(
                      "text-[10px] mt-0.5",
                      day.count > 0
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {formatNumber(day.count, language)}
                  </div>
                </Link>
              ))}
            </div>

            {yesterdayLeftover.length > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2">
                <p className="text-sm inline-flex items-center gap-2">
                  <span>{t.dashboard.yesterdayBanner}</span>
                  <Badge tone="warning">{yesterdayLeftover.length}</Badge>
                </p>
                <Button
                  size="sm"
                  variant="primary"
                  loading={pending}
                  onClick={onMoveYesterday}
                >
                  {t.dashboard.yesterdayBannerAction}
                </Button>
              </div>
            ) : null}

            <CapturePageDate dueDate={todayKey} />
            <QuickCapture
              compact
              dueDate={todayKey}
              hint={t.dashboard.focusTodayHint}
            />

            <DndContext
              sensors={sensors}
              collisionDetection={pointerWithin}
              onDragStart={onFocusDragStart}
              onDragEnd={onFocusDragEnd}
            >
            <div className="grid items-stretch gap-3 lg:grid-cols-2">
            <section className="flex h-full min-w-0 flex-col rounded-xl border border-border-default bg-bg-surface">
              <div className="px-4 py-3 border-b border-border-subtle bg-bg-sunken">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold">
                    {t.dashboard.focusPriorities}
                  </h2>
                  <Badge tone={pinnedDone === 3 ? "success" : "count"}>
                    {formatNumber(pinnedDone, language)}/{formatNumber(3, language)}
                  </Badge>
                  {pinnedDone > 0 ? (
                    <span className="text-sm text-emerald-600" aria-hidden>
                      ✓
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t.dashboard.focusPrioritiesHint}
                </p>
              </div>
              <TodayFocusSlots
                slots={focusTasks}
                candidates={focusCandidates}
                todayKey={todayKey}
                disabled={pending}
                onPlace={placeFocus}
                onOpen={openTask}
                onDone={taskId => {
                  startTransition(async () => {
                    const result = await completePersonalTask(taskId);
                    if (!result.success) {
                      toast.error(result.error ?? t.common.error);
                      return;
                    }
                    router.refresh();
                  });
                }}
              />
            </section>

            <section className="flex h-full min-w-0 flex-col rounded-xl border border-border-default bg-bg-surface">
              <div className="border-b border-border-subtle bg-bg-sunken px-4 py-3">
                <h2 className="text-sm font-semibold">{t.dashboard.focusToday}</h2>
                <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{t.dashboard.sessionHint}</p>
              </div>
              <FocusSessionCard />
            </section>
            </div>

            <section className="bg-bg-surface border border-border-default rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-border-subtle bg-bg-sunken">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold">{t.dashboard.today}</h2>
                  <Badge tone="count">{today.length}</Badge>
                </div>
              </div>
              <div className="px-3 py-2">
                <LifeTaskList
                  tasks={today}
                  empty={t.dashboard.noTasksToday}
                  enableDrag
                  canPinFocus={task => isTodayFocusCandidate(task, todayKey)}
                  {...listProps}
                />
              </div>
            </section>

            <section
              id="today-side-lists"
              className="scroll-mt-4 bg-bg-surface border border-border-default rounded-lg overflow-hidden"
            >
              <div className="flex flex-wrap gap-1 px-2 py-2 border-b border-border-subtle">
                {sideTabs.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSideTab(tab.id)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                      sideTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {tab.label}
                    <span className="ms-1 opacity-80">
                      {formatNumber(tab.count, language)}
                    </span>
                  </button>
                ))}
              </div>
              <div className="px-3 py-2">
                <LifeTaskList
                  tasks={sideTasks}
                  empty={sideEmpty}
                  showPlan={sideTab === "inbox"}
                  showPlanToday
                  enableDrag
                  canPinFocus={task => isTodayFocusCandidate(task, todayKey)}
                  {...listProps}
                />
              </div>
            </section>
            <DragOverlay>
              {draggingTitle ? (
                <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-md">
                  {draggingTitle}
                </div>
              ) : null}
            </DragOverlay>
            </DndContext>
          </div>

          <aside className="order-2 flex min-w-0 flex-col gap-4">
            <section className="bg-bg-surface border border-border-default rounded-lg p-4">
              <h2 className="text-sm font-semibold mb-3">
                {t.dashboard.snapshotTitle}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-bg-sunken px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t.dashboard.hoursThisWeek}
                  </div>
                  <div className="text-xl font-semibold mt-0.5 tabular-nums">
                    {formatNumber(formatWeekHours(hoursThisWeek), language)}
                  </div>
                </div>
                <div className="rounded-md bg-bg-sunken px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t.dashboard.doneThisWeek}
                  </div>
                  <div className="text-xl font-semibold mt-0.5 tabular-nums">
                    {formatNumber(doneThisWeek, language)}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2.5">
                <BarRow
                  label={t.dashboard.overdue}
                  value={overdue.length}
                  max={loadMax}
                  tone="danger"
                />
                <BarRow
                  label={t.dashboard.today}
                  value={today.length + pinnedOpen}
                  max={loadMax}
                />
                <BarRow
                  label={t.dashboard.inbox}
                  value={inbox.length}
                  max={loadMax}
                  tone="muted"
                />
                <BarRow
                  label={t.dashboard.doneThisWeek}
                  value={doneThisWeek}
                  max={loadMax}
                  tone="success"
                />
              </div>
            </section>

            <div className="grid items-stretch gap-3 lg:grid-cols-2">
            <section className="flex h-full min-w-0 flex-col bg-bg-surface border border-border-default rounded-lg p-4">
              <h2 className="text-sm font-semibold mb-3">
                {t.dashboard.weekLoadTitle}
              </h2>
              <div className="flex items-end gap-1.5 h-28">
                {weekDays.map((day, i) => {
                  const h =
                    weekMax > 0 ? Math.max(8, (day.count / weekMax) * 100) : 8;
                  return (
                    <Link
                      key={day.dateKey}
                      href="/calendar"
                      className="flex-1 min-w-0 flex flex-col items-center justify-end gap-1 h-full group"
                      title={`${weekdayLabels[i]}: ${day.count}`}
                    >
                      <span className="text-[10px] tabular-nums text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.count || ""}
                      </span>
                      <div
                        className={cn(
                          "w-full rounded-t-sm transition-colors",
                          day.isToday
                            ? "bg-primary"
                            : day.count > 0
                              ? "bg-primary/45 group-hover:bg-primary/70"
                              : "bg-bg-sunken",
                        )}
                        style={{ height: `${day.count > 0 ? h : 6}%` }}
                      />
                      <span
                        className={cn(
                          "text-[10px] truncate w-full text-center",
                          day.isToday
                            ? "text-primary font-medium"
                            : "text-muted-foreground",
                        )}
                      >
                        {weekdayLabels[i].slice(0, language === "EN" ? 2 : 1)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="flex h-full min-w-0 flex-col bg-bg-surface border border-border-default rounded-lg p-4">
              <h2 className="text-sm font-semibold mb-3">
                {t.dashboard.areasShortcut}
              </h2>
              <div className="flex flex-col gap-2.5">
                {areas.length === 0 ? (
                  <p className="text-xs text-muted-foreground">—</p>
                ) : (
                  areas.map(area => (
                    <Link
                      key={area.id}
                      href={
                        area.area
                          ? `/kanban?area=${area.area}`
                          : `/kanban?project=${area.id}`
                      }
                      className="block hover:opacity-90"
                    >
                      <BarRow
                        label={area.name}
                        value={area.openTasks}
                        max={areaMax}
                      />
                    </Link>
                  ))
                )}
              </div>
            </section>
            </div>

            <HabitsPanel initialHabits={habits} />

            <div className="flex flex-wrap gap-x-3 gap-y-1 px-1 text-xs text-muted-foreground">
              <button
                type="button"
                className="text-primary hover:underline"
                disabled={writingPending}
                onClick={() => void openDaily()}
              >
                {t.docs.dailyNote}
              </button>
              <Link href="/docs" className="hover:text-foreground">
                {t.docs.openDocs}
              </Link>
              <Link href="/projects" className="hover:text-foreground">
                {t.nav.projects}
              </Link>
              <Link href="/work-logs" className="hover:text-foreground">
                {t.nav.workLogs}
              </Link>
            </div>
          </aside>
        </div>
      </div>
      {drawer}
      <OnboardingTour open={showOnboarding} />
    </>
    </FocusSessionProvider>
  );
}
