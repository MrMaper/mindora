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
import { openCapture } from "@/features/capture/open-capture";
import {
  formatJalaliDate,
  formatJalaliShort,
  PERSIAN_WEEKDAYS_SAT,
} from "@/lib/life";
import { formatNumber, formatHours, cn } from "@/lib/utils";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { Button } from "@/components/ui-kit/forms/button";
import type { WeekDayStripItem } from "@/features/life/queries";
import type { TaskRow } from "@/features/tasks/types";
import type { UserRow } from "@/features/users/types";
import type { LabelRow } from "@/features/labels/types";
import type { ProjectRow } from "@/features/projects/types";
import type { LifeArea } from "@/types/db";

type SideTab = "inbox" | "waiting" | "overdue" | "week";

interface DashboardCCProps {
  userName: string;
  areas: { id: string; name: string; area: LifeArea | null; openTasks: number }[];
  overdue: TaskRow[];
  today: TaskRow[];
  week: TaskRow[];
  inbox: TaskRow[];
  waiting: TaskRow[];
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
        <Link href="/research?tab=library" className={chipClass}>
          <span className="size-2 rounded-full bg-blue-500" />
          {countPhrase(attention.sourcesToRead, t.dashboard.attentionSourceOne, t.dashboard.attentionSources, language)}
        </Link>
      ),
    });
  }
  if (modules.research && attention.phdDrafting > 0) {
    chips.push({
      key: "writing",
      node: (
        <Link href="/research?tab=writing" className={chipClass}>
          <span className="size-2 rounded-full bg-sky-600" />
          {countPhrase(
            attention.phdDrafting,
            t.dashboard.attentionWritingOne,
            t.dashboard.attentionWritingMany,
            language,
          )}
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

function EmptyQueue({
  title,
  hint,
  cta,
  onCta,
}: {
  title: string;
  hint?: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <p className="text-sm text-foreground/80">{title}</p>
      {hint ? <p className="text-xs text-muted-foreground max-w-xs">{hint}</p> : null}
      {cta && onCta ? (
        <Button size="sm" variant="subtle" icon="plus" onClick={onCta}>
          {cta}
        </Button>
      ) : null}
    </div>
  );
}

function CompactKpiBar({
  todayCount,
  overdueCount,
  inboxCount,
  hoursThisWeek,
  onToday,
  onOverdue,
  onInbox,
}: {
  todayCount: number;
  overdueCount: number;
  inboxCount: number;
  hoursThisWeek: number;
  onToday: () => void;
  onOverdue: () => void;
  onInbox: () => void;
}) {
  const t = useTranslation();
  const language = useLanguage();
  const allZero =
    todayCount === 0 &&
    overdueCount === 0 &&
    inboxCount === 0 &&
    hoursThisWeek === 0;
  if (allZero) return null;

  const items: {
    key: string;
    label: string;
    value: string;
    onClick?: () => void;
    danger?: boolean;
  }[] = [
    {
      key: "today",
      label: t.dashboard.kpiToday,
      value: formatNumber(todayCount, language),
      onClick: onToday,
    },
    {
      key: "overdue",
      label: t.dashboard.kpiOverdue,
      value: formatNumber(overdueCount, language),
      onClick: onOverdue,
      danger: overdueCount > 0,
    },
    {
      key: "inbox",
      label: t.dashboard.kpiInbox,
      value: formatNumber(inboxCount, language),
      onClick: onInbox,
    },
    {
      key: "hours",
      label: t.dashboard.kpiFocusHours,
      value: formatHours(hoursThisWeek, language, hoursThisWeek > 0 && hoursThisWeek < 0.05 ? 2 : 1),
    },
  ];

  return (
    <div className="flex flex-wrap items-stretch gap-1 rounded-xl border border-border-default bg-bg-surface p-1">
      {items.map(item => {
        const Comp = item.onClick ? "button" : "div";
        return (
          <Comp
            key={item.key}
            type={item.onClick ? "button" : undefined}
            onClick={item.onClick}
            className={cn(
              "min-w-0 flex-1 rounded-lg px-2.5 py-2 text-start transition-colors",
              item.onClick && "hover:bg-bg-hover",
            )}
          >
            <div
              className={cn(
                "text-base font-semibold tabular-nums leading-none",
                item.danger && "text-destructive",
              )}
            >
              {item.value}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground truncate">
              {item.label}
            </div>
          </Comp>
        );
      })}
    </div>
  );
}

function WeekBalanceCard({
  weekDays,
  areas,
  weekdayLabels,
}: {
  weekDays: WeekDayStripItem[];
  areas: DashboardCCProps["areas"];
  weekdayLabels: string[];
}) {
  const t = useTranslation();
  const language = useLanguage();
  const weekMax = Math.max(1, ...weekDays.map(d => d.count));
  const areaTotal = areas.reduce((n, a) => n + a.openTasks, 0);

  return (
    <section className="rounded-xl border border-border-default bg-bg-surface p-4">
      <h2 className="text-sm font-semibold mb-3">{t.dashboard.weekBalanceTitle}</h2>
      <div className="flex items-end gap-1.5 h-24 mb-4">
        {weekDays.map((day, i) => {
          const h = weekMax > 0 ? Math.max(8, (day.count / weekMax) * 100) : 8;
          return (
            <Link
              key={day.dateKey}
              href="/calendar"
              className="flex-1 min-w-0 flex flex-col items-center justify-end gap-1 h-full group"
              title={`${weekdayLabels[i]}: ${day.count}`}
            >
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
      {areas.length === 0 ? (
        <p className="text-xs text-muted-foreground">—</p>
      ) : (
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs">
          {areas.map(area => {
            const pct =
              areaTotal > 0
                ? Math.round((area.openTasks / areaTotal) * 100)
                : 0;
            return (
              <Link
                key={area.id}
                href={
                  area.area
                    ? `/projects/areas/${area.area.toLowerCase()}`
                    : `/projects`
                }
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <span className="font-medium text-foreground">{area.name}</span>
                <span className="tabular-nums">
                  {formatNumber(pct, language)}%
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function DashboardCC({
  userName,
  areas,
  overdue,
  today,
  week,
  inbox,
  waiting,
  yesterdayLeftover,
  focusTasks,
  focusIds,
  focusCandidates,
  weekDays,
  hoursThisWeek,
  doneThisWeek: _doneThisWeek,
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
    overdue.length > 0
      ? "overdue"
      : waiting.length > 0
        ? "waiting"
        : inbox.length > 0
          ? "inbox"
          : "week",
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
    const task = [
      ...focusTasks,
      ...today,
      ...overdue,
      ...week,
      ...inbox,
      ...waiting,
    ].find(item => item?.id === id);
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
    const task = [
      ...focusTasks,
      ...today,
      ...overdue,
      ...week,
      ...inbox,
      ...waiting,
    ].find(item => item?.id === taskId);
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
    { id: "waiting", label: t.dashboard.tabWaiting, count: waiting.length },
    { id: "overdue", label: t.dashboard.tabOverdue, count: overdue.length },
    { id: "week", label: t.dashboard.tabWeek, count: week.length },
  ];

  const sideTasks = (
    sideTab === "inbox"
      ? inbox
      : sideTab === "waiting"
        ? waiting
        : sideTab === "overdue"
          ? overdue
          : week
  ).filter(task => !today.some(item => item.id === task.id));

  const sideEmpty =
    sideTab === "inbox" ? (
      <EmptyQueue
        title={t.dashboard.noInbox}
        hint={t.dashboard.noInboxHint}
        cta={t.dashboard.noInboxCta}
        onCta={() => openCapture()}
      />
    ) : sideTab === "waiting" ? (
      <EmptyQueue
        title={t.dashboard.noWaiting}
        hint={t.dashboard.noWaitingHint}
      />
    ) : sideTab === "overdue" ? (
      <EmptyQueue title={t.dashboard.noOverdue} />
    ) : (
      <EmptyQueue
        title={t.dashboard.noTasksThisWeek}
        hint={t.dashboard.noTasksThisWeekHint}
        cta={t.dashboard.noTasksThisWeekCta}
        onCta={() => router.push("/calendar")}
      />
    );

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

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

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
            scrollTo("today-work-queue");
          }}
        />

        <CompactKpiBar
          todayCount={today.length + pinnedOpen}
          overdueCount={overdue.length}
          inboxCount={inbox.length}
          hoursThisWeek={hoursThisWeek}
          onToday={() => scrollTo("today-due-list")}
          onOverdue={() => {
            setSideTab("overdue");
            scrollTo("today-work-queue");
          }}
          onInbox={() => {
            setSideTab("inbox");
            scrollTo("today-work-queue");
          }}
        />

        <div className="grid items-start gap-4 lg:grid-cols-2">
          <div className="order-1 flex min-w-0 flex-col gap-4">
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 overflow-x-auto">
              {weekDays.map((day, i) => (
                <Link
                  key={day.dateKey}
                  href="/calendar"
                  className={cn(
                    "min-w-0 rounded-md border border-border-default bg-bg-surface px-0.5 py-1 sm:py-1.5 text-center hover:bg-bg-hover transition-colors",
                    day.isToday && "border-primary bg-primary/5",
                    day.isPast && !day.isToday && "opacity-70",
                  )}
                >
                  <div className="text-[9px] sm:text-[10px] text-muted-foreground truncate">
                    {weekdayLabels[i]}
                  </div>
                  <div className="text-[11px] sm:text-xs font-medium leading-tight mt-0.5">
                    {formatJalaliShort(day.date, language).split(" ")[0]}
                  </div>
                  <div
                    className={cn(
                      "text-[9px] sm:text-[10px] mt-0.5",
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

            <section
              id="today-due-list"
              className="scroll-mt-4 bg-bg-surface border border-border-default rounded-lg overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-border-subtle bg-bg-sunken">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold">{t.dashboard.today}</h2>
                  <Badge tone="count">{today.length}</Badge>
                </div>
              </div>
              <div className="px-3 py-2">
                <LifeTaskList
                  tasks={today}
                  empty={
                    <EmptyQueue
                      title={t.dashboard.noTasksToday}
                      hint={t.dashboard.noTasksTodayHint}
                      cta={t.dashboard.noTasksTodayCta}
                      onCta={() => openCapture({ dueDate: todayKey })}
                    />
                  }
                  enableDrag
                  canPinFocus={task => isTodayFocusCandidate(task, todayKey)}
                  {...listProps}
                />
              </div>
            </section>

            <section
              id="today-work-queue"
              className="scroll-mt-4 bg-bg-surface border border-border-default rounded-lg overflow-hidden"
            >
              <div className="px-4 pt-3 pb-1">
                <h2 className="text-sm font-semibold">{t.dashboard.workQueueTitle}</h2>
              </div>
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
            <WeekBalanceCard
              weekDays={weekDays}
              areas={areas}
              weekdayLabels={weekdayLabels}
            />

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
