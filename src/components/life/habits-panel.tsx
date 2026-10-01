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
} from "@/features/habits/actions";
import type { HabitHeatDay, HabitItem } from "@/features/habits/queries";
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
    <div ref={ref} className="mb-3 min-h-[9rem] w-full min-w-0">
      {visible ? (
        <HabitHeatmap
          habits={habits}
          days={days}
          filterId={filterId}
          onFilterChange={onFilterChange}
        />
      ) : (
        <div className="h-[9rem] w-full rounded-md bg-muted/30" aria-hidden />
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
    <div className="inline-flex rounded-md bg-muted/60 p-0.5" role="group">
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
            "rounded-[5px] px-2 py-0.5 text-[11px] font-medium transition-colors",
            value === key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
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
  /** Empty archive is valid — don't re-fetch / lock tabs on every visit. */
  const archivedLoadedRef = React.useRef(false);
  const archiveLoadingRef = React.useRef(false);

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

  function showActive() {
    setEditingId(null);
    setView("active");
  }

  function showArchived() {
    setEditingId(null);
    setView("archived");
    if (archivedLoadedRef.current || archiveLoadingRef.current) return;
    archiveLoadingRef.current = true;
    void softReloadArchived()
      .then(() => {
        archivedLoadedRef.current = true;
      })
      .catch(error => {
        console.error("load archived habits failed", error);
        toast.error(t.common.error);
      })
      .finally(() => {
        archiveLoadingRef.current = false;
      });
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
    archivedLoadedRef.current = false;
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
    void softReloadActive();
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
  const showComposerMeta = title.trim().length > 0;

  return (
    <section className="rounded-xl border bg-card p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{t.habits.title}</h2>
        <p className="sr-only">{t.habits.hint}</p>
        <div
          role="tablist"
          className="inline-flex rounded-md bg-muted/60 p-0.5"
        >
          {(
            [
              ["active", t.habits.tabActive, showActive],
              ["archived", t.habits.tabArchived, showArchived],
            ] as const
          ).map(([key, label, onClick]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={view === key}
              onClick={onClick}
              className={cn(
                "rounded-[5px] px-2.5 py-0.5 text-xs font-medium transition-colors",
                view === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === "active" ? (
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={t.habits.newPlaceholder}
                onKeyDown={e => {
                  if (e.key === "Enter") void onAdd();
                }}
              />
            </div>
            <IconButton
              icon="plus"
              variant="solid"
              size="md"
              className="shrink-0"
              aria-label={t.habits.add}
              disabled={!canAdd}
              onClick={() => void onAdd()}
            />
          </div>
          {showComposerMeta ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <CadenceChips
                value={cadence}
                onChange={setCadence}
                disabled={pending}
                dailyLabel={t.habits.cadenceDaily}
                weeklyLabel={t.habits.cadenceWeekly}
              />
              <Select
                options={areaOptions}
                value={area}
                onChange={value => setArea((value as LifeArea | "") || "")}
                placeholder={t.habits.areaLabel}
                disabled={pending}
                wrapperClassName="w-[8.5rem] shrink-0"
              />
            </div>
          ) : null}
        </div>
      ) : null}

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
