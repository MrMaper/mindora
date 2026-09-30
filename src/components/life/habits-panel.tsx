"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Button } from "@/components/ui-kit/forms/button";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import { Input } from "@/components/ui-kit/forms/input";
import { Select } from "@/components/ui-kit/forms/select";
import { Menu, type MenuItem } from "@/components/ui-kit/overlays/menu";
import { useTranslation } from "@/i18n/provider";
import {
  archiveHabitAction,
  createHabitAction,
  deleteHabitAction,
  getHabitHeatmapAction,
  listHabitsAction,
  restoreHabitAction,
  toggleHabitDoneAction,
  updateHabitAction,
  type HabitHeatDay,
  type HabitItem,
} from "@/features/habits/actions";
import { HABIT_HEATMAP_WEEKS } from "@/features/habits/constants";
import { cn } from "@/lib/utils";
import type { LifeArea, RecurrenceInterval } from "@/types/db";

const HabitHeatmap = dynamic(
  () => import("@/components/life/habit-heatmap").then(m => m.HabitHeatmap),
  {
    ssr: false,
    loading: () => (
      <div className="mb-3 h-[7.5rem] animate-pulse rounded-md bg-muted/40" />
    ),
  },
);

type HabitsView = "active" | "archived";
type HabitCadence = "DAILY" | "WEEKLY";

function HeatmapWhenVisible({
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
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "160px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className="mb-3 min-h-[7.5rem] w-full min-w-0">
      {visible ? (
        <HabitHeatmap
          habits={habits}
          days={days}
          filterId={filterId}
          onFilterChange={onFilterChange}
        />
      ) : (
        <div className="h-[7.5rem] w-full rounded-md bg-muted/30" aria-hidden />
      )}
    </div>
  );
}

function CadenceChips({
  value,
  onChange,
  disabled,
  dailyLabel,
  weeklyLabel,
}: {
  value: HabitCadence;
  onChange: (next: HabitCadence) => void;
  disabled?: boolean;
  dailyLabel: string;
  weeklyLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-1" role="group">
      {(
        [
          ["DAILY", dailyLabel],
          ["WEEKLY", weeklyLabel],
        ] as const
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          disabled={disabled}
          onClick={() => onChange(key)}
          className={cn(
            "rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
            value === key
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-transparent bg-muted/60 text-muted-foreground hover:bg-muted",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-muted/70 px-1.5 py-0.5 text-[10px] text-muted-foreground">
      {children}
    </span>
  );
}

export function HabitsPanel({
  initialHabits = [],
  initialHeatDays = [],
}: {
  initialHabits?: HabitItem[];
  initialHeatDays?: HabitHeatDay[];
}) {
  const t = useTranslation();
  const [view, setView] = React.useState<HabitsView>("active");
  const [habits, setHabits] = React.useState(initialHabits);
  const [archivedHabits, setArchivedHabits] = React.useState<HabitItem[]>([]);
  const [title, setTitle] = React.useState("");
  const [cadence, setCadence] = React.useState<HabitCadence>("DAILY");
  const [area, setArea] = React.useState<LifeArea | "">("");
  const [pending, setPending] = React.useState(false);
  const [heatFilter, setHeatFilter] = React.useState("all");
  const [heatDays, setHeatDays] = React.useState(initialHeatDays);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editCadence, setEditCadence] = React.useState<HabitCadence>("DAILY");
  const [editArea, setEditArea] = React.useState<LifeArea | "">("");

  const areaOptions = React.useMemo(
    () => [
      { value: "", label: t.habits.areaNone },
      { value: "PHD", label: t.dashboard.areaPhd },
      { value: "WORK", label: t.dashboard.areaWork },
      { value: "LIFE", label: t.dashboard.areaLife },
      { value: "LANG", label: t.dashboard.areaLang },
    ],
    [t],
  );

  function areaLabel(value: LifeArea | null | undefined): string | null {
    if (!value) return null;
    if (value === "PHD") return t.dashboard.areaPhd;
    if (value === "WORK") return t.dashboard.areaWork;
    if (value === "LANG") return t.dashboard.areaLang;
    return t.dashboard.areaLife;
  }

  function cadenceLabel(value: RecurrenceInterval): string {
    return value === "WEEKLY" ? t.habits.cadenceWeekly : t.habits.cadenceDaily;
  }

  React.useEffect(() => {
    setHabits(initialHabits);
  }, [initialHabits]);

  React.useEffect(() => {
    setHeatDays(initialHeatDays);
  }, [initialHeatDays]);

  React.useEffect(() => {
    if (heatFilter === "all") {
      setHeatDays(initialHeatDays);
      return;
    }
    let cancelled = false;
    void getHabitHeatmapAction({
      habitId: heatFilter,
      weeks: HABIT_HEATMAP_WEEKS,
    }).then(days => {
      if (!cancelled) setHeatDays(days);
    });
    return () => {
      cancelled = true;
    };
  }, [heatFilter, initialHeatDays]);

  async function softReloadActive() {
    const [rows, days] = await Promise.all([
      listHabitsAction(),
      getHabitHeatmapAction({
        habitId: heatFilter === "all" ? null : heatFilter,
        weeks: HABIT_HEATMAP_WEEKS,
      }),
    ]);
    setHabits(rows);
    setHeatDays(days);
  }

  async function softReloadArchived() {
    const rows = await listHabitsAction({ archived: true });
    setArchivedHabits(rows);
  }

  async function switchView(next: HabitsView) {
    setEditingId(null);
    setView(next);
    if (next === "archived" && archivedHabits.length === 0) {
      setPending(true);
      await softReloadArchived();
      setPending(false);
    }
  }

  async function onAdd() {
    if (!title.trim()) {
      toast.error(t.habits.titleRequired);
      return;
    }
    setPending(true);
    const result = await createHabitAction({
      title,
      cadence,
      area: area || null,
    });
    setPending(false);
    if (result.success) {
      setTitle("");
      setCadence("DAILY");
      setArea("");
      if (view !== "active") setView("active");
      toast.success(t.habits.added);
      await softReloadActive();
    } else {
      toast.error(result.error ?? t.common.error);
    }
  }

  async function onToggle(id: string) {
    const prev = habits;
    setHabits(rows =>
      rows.map(h => {
        if (h.id !== id) return h;
        const nextDone = !h.doneToday;
        return {
          ...h,
          doneToday: nextDone,
          streak: nextDone ? h.streak + 1 : Math.max(0, h.streak - 1),
          bestStreak: nextDone
            ? Math.max(h.bestStreak, h.streak + 1)
            : h.bestStreak,
        };
      }),
    );
    const result = await toggleHabitDoneAction(id);
    if (!result.success) {
      setHabits(prev);
      toast.error(result.error ?? t.common.error);
      return;
    }
    const streak = Number(result.data?.streak);
    const best = Number(result.data?.bestStreak);
    const done = result.data?.done === true;
    setHabits(rows =>
      rows.map(h =>
        h.id === id
          ? {
              ...h,
              doneToday: done,
              streak: Number.isFinite(streak) ? streak : h.streak,
              bestStreak: Number.isFinite(best) ? best : h.bestStreak,
            }
          : h,
      ),
    );
    void getHabitHeatmapAction({
      habitId: heatFilter === "all" ? null : heatFilter,
      weeks: HABIT_HEATMAP_WEEKS,
    }).then(setHeatDays);
  }

  async function onArchive(id: string) {
    setPending(true);
    const result = await archiveHabitAction(id);
    setPending(false);
    if (!result.success) {
      toast.error(result.error ?? t.common.error);
      return;
    }
    if (heatFilter === id) setHeatFilter("all");
    if (editingId === id) setEditingId(null);
    setHabits(rows => rows.filter(h => h.id !== id));
    toast.success(t.habits.archivedToast);
    void softReloadActive();
  }

  async function onRestore(id: string) {
    setPending(true);
    const result = await restoreHabitAction(id);
    setPending(false);
    if (!result.success) {
      toast.error(result.error ?? t.common.error);
      return;
    }
    if (editingId === id) setEditingId(null);
    setArchivedHabits(rows => rows.filter(h => h.id !== id));
    toast.success(t.habits.restoredToast);
  }

  function startEdit(habit: HabitItem) {
    setEditingId(habit.id);
    setEditTitle(habit.title);
    setEditCadence(habit.cadence === "WEEKLY" ? "WEEKLY" : "DAILY");
    setEditArea(habit.area ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditCadence("DAILY");
    setEditArea("");
  }

  async function onSaveEdit(id: string) {
    const next = editTitle.trim();
    if (!next) {
      toast.error(t.habits.titleRequired);
      return;
    }
    setPending(true);
    const result = await updateHabitAction({
      habitId: id,
      title: next,
      cadence: editCadence,
      area: editArea || null,
    });
    setPending(false);
    if (!result.success) {
      toast.error(result.error ?? t.common.error);
      return;
    }
    const streak = Number(result.data?.streak);
    const best = Number(result.data?.bestStreak);
    const patch = (h: HabitItem): HabitItem =>
      h.id === id
        ? {
            ...h,
            title: next,
            cadence: editCadence,
            area: editArea || null,
            streak: Number.isFinite(streak) ? streak : h.streak,
            bestStreak: Number.isFinite(best) ? best : h.bestStreak,
          }
        : h;

    setEditingId(null);
    setEditTitle("");
    if (view === "archived") {
      setArchivedHabits(rows => rows.map(patch));
    } else {
      setHabits(rows => rows.map(patch));
      void softReloadActive();
    }
    toast.success(t.habits.saved);
  }

  async function onDelete(id: string) {
    if (!window.confirm(t.habits.deleteConfirm)) return;
    setPending(true);
    const result = await deleteHabitAction(id);
    setPending(false);
    if (!result.success) {
      toast.error(result.error ?? t.common.error);
      return;
    }
    if (heatFilter === id) setHeatFilter("all");
    if (editingId === id) setEditingId(null);
    if (view === "archived") {
      setArchivedHabits(rows => rows.filter(h => h.id !== id));
    } else {
      setHabits(rows => rows.filter(h => h.id !== id));
      void softReloadActive();
    }
    toast.success(t.habits.deletedToast);
  }

  const canAdd = title.trim().length > 0 && !pending;
  const list = view === "archived" ? archivedHabits : habits;

  return (
    <section className="rounded-xl border bg-card p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">{t.habits.title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t.habits.hint}</p>
        </div>
      </div>

      <div className="mb-3 space-y-2">
        <div className="flex gap-2">
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={t.habits.newPlaceholder}
            onKeyDown={e => {
              if (e.key === "Enter") void onAdd();
            }}
          />
          <Button
            size="sm"
            variant="primary"
            disabled={!canAdd}
            onClick={() => void onAdd()}
          >
            {t.habits.add}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CadenceChips
            value={cadence}
            onChange={setCadence}
            disabled={pending}
            dailyLabel={t.habits.cadenceDaily}
            weeklyLabel={t.habits.cadenceWeekly}
          />
          <div className="min-w-[8.5rem] flex-1 sm:max-w-[11rem]">
            <Select
              options={areaOptions}
              value={area}
              onChange={value => setArea((value as LifeArea | "") || "")}
              placeholder={t.habits.areaLabel}
              disabled={pending}
            />
          </div>
        </div>
      </div>

      <div
        role="tablist"
        className="mb-3 flex flex-wrap gap-1 border-b border-border pb-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={view === "active"}
          disabled={pending}
          onClick={() => void switchView("active")}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            view === "active"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          {t.habits.tabActive}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "archived"}
          disabled={pending}
          onClick={() => void switchView("archived")}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            view === "archived"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          {t.habits.tabArchived}
        </button>
      </div>

      {view === "active" ? (
        <HeatmapWhenVisible
          habits={habits}
          days={heatDays}
          filterId={heatFilter}
          onFilterChange={setHeatFilter}
        />
      ) : null}

      {list.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          {view === "archived" ? t.habits.archivedEmpty : t.habits.empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map(h => {
            const isEditing = editingId === h.id;
            const menuItems: MenuItem[] = [
              {
                label: t.habits.edit,
                icon: "pencil",
                onClick: () => startEdit(h),
                disabled: pending || isEditing,
              },
              view === "active"
                ? {
                    label: t.habits.archive,
                    icon: "archive",
                    onClick: () => void onArchive(h.id),
                    disabled: pending,
                  }
                : {
                    label: t.habits.restore,
                    icon: "rotate-ccw",
                    onClick: () => void onRestore(h.id),
                    disabled: pending,
                  },
              {
                label: t.habits.delete,
                icon: "trash",
                onClick: () => void onDelete(h.id),
                disabled: pending,
                danger: true,
              },
            ];

            return (
              <li
                key={h.id}
                className="flex items-start gap-2 rounded-lg border px-3 py-2"
              >
                {view === "active" && !isEditing ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void onToggle(h.id)}
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[11px]",
                      h.doneToday
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-accent",
                    )}
                    aria-label={
                      h.doneToday ? t.habits.undoToday : t.habits.markToday
                    }
                  >
                    {h.doneToday ? "✓" : ""}
                  </button>
                ) : (
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-dashed text-[10px] text-muted-foreground"
                    aria-hidden
                  >
                    —
                  </span>
                )}

                {isEditing ? (
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Input
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      placeholder={t.habits.editTitlePlaceholder}
                      className="min-w-0"
                      autoFocus
                      disabled={pending}
                      onKeyDown={e => {
                        if (e.key === "Enter") void onSaveEdit(h.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <CadenceChips
                        value={editCadence}
                        onChange={setEditCadence}
                        disabled={pending}
                        dailyLabel={t.habits.cadenceDaily}
                        weeklyLabel={t.habits.cadenceWeekly}
                      />
                      <div className="min-w-[8.5rem] flex-1 sm:max-w-[11rem]">
                        <Select
                          options={areaOptions}
                          value={editArea}
                          onChange={value =>
                            setEditArea((value as LifeArea | "") || "")
                          }
                          placeholder={t.habits.areaLabel}
                          disabled={pending}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={pending || !editTitle.trim()}
                        onClick={() => void onSaveEdit(h.id)}
                      >
                        {t.habits.save}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={cancelEdit}
                      >
                        {t.habits.cancel}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">{h.title}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <MetaChip>{cadenceLabel(h.cadence)}</MetaChip>
                        {areaLabel(h.area) ? (
                          <MetaChip>{areaLabel(h.area)}</MetaChip>
                        ) : null}
                        <span className="text-[11px] tabular-nums text-muted-foreground">
                          {t.habits.streakLabel
                            .replace("{streak}", String(h.streak))
                            .replace("{best}", String(h.bestStreak))}
                        </span>
                      </div>
                    </div>
                    <Menu
                      trigger={
                        <IconButton
                          icon="more-horizontal"
                          size="sm"
                          aria-label={t.common.actions}
                          disabled={pending}
                        />
                      }
                      align="end"
                      items={menuItems}
                    />
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
