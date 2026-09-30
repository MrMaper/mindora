"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui-kit/forms/button";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import { Input } from "@/components/ui-kit/forms/input";
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

const HabitHeatmap = dynamic(
  () => import("@/components/life/habit-heatmap").then(m => m.HabitHeatmap),
  {
    ssr: false,
    loading: () => (
      <div className="mb-3 h-[4.5rem] animate-pulse rounded-md bg-muted/40" />
    ),
  },
);

type HabitsView = "active" | "archived";

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
    <div ref={ref} className="mb-3 min-h-[4.5rem]">
      {visible ? (
        <HabitHeatmap
          habits={habits}
          days={days}
          filterId={filterId}
          onFilterChange={onFilterChange}
        />
      ) : (
        <div className="h-[4.5rem] rounded-md bg-muted/30" aria-hidden />
      )}
    </div>
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
  const [pending, setPending] = React.useState(false);
  const [heatFilter, setHeatFilter] = React.useState("all");
  const [heatDays, setHeatDays] = React.useState(initialHeatDays);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");

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
    if (!title.trim()) return;
    setPending(true);
    const result = await createHabitAction({ title });
    setPending(false);
    if (result.success) {
      setTitle("");
      if (view !== "active") setView("active");
      await softReloadActive();
    } else if (result.error) {
      window.alert(result.error);
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
      if (result.error) window.alert(result.error);
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
      if (result.error) window.alert(result.error);
      return;
    }
    if (heatFilter === id) setHeatFilter("all");
    if (editingId === id) setEditingId(null);
    setHabits(rows => rows.filter(h => h.id !== id));
    void softReloadActive();
  }

  async function onRestore(id: string) {
    setPending(true);
    const result = await restoreHabitAction(id);
    setPending(false);
    if (!result.success && result.error) {
      window.alert(result.error);
      return;
    }
    if (editingId === id) setEditingId(null);
    setArchivedHabits(rows => rows.filter(h => h.id !== id));
  }

  function startEdit(habit: HabitItem) {
    setEditingId(habit.id);
    setEditTitle(habit.title);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
  }

  async function onSaveEdit(id: string) {
    const next = editTitle.trim();
    if (!next) {
      window.alert(t.habits.editTitlePlaceholder);
      return;
    }
    setPending(true);
    const result = await updateHabitAction({ habitId: id, title: next });
    setPending(false);
    if (!result.success) {
      if (result.error) window.alert(result.error);
      return;
    }
    setEditingId(null);
    setEditTitle("");
    if (view === "archived") {
      setArchivedHabits(rows =>
        rows.map(h => (h.id === id ? { ...h, title: next } : h)),
      );
    } else {
      setHabits(rows =>
        rows.map(h => (h.id === id ? { ...h, title: next } : h)),
      );
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm(t.habits.deleteConfirm)) return;
    setPending(true);
    const result = await deleteHabitAction(id);
    setPending(false);
    if (!result.success) {
      if (result.error) window.alert(result.error);
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

      <div className="mb-3 flex gap-2">
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
                className="flex items-center gap-2 rounded-lg border px-3 py-2"
              >
                {view === "active" && !isEditing ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void onToggle(h.id)}
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[11px]",
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
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-dashed text-[10px] text-muted-foreground"
                    aria-hidden
                  >
                    —
                  </span>
                )}

                {isEditing ? (
                  <>
                    <Input
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      placeholder={t.habits.editTitlePlaceholder}
                      className="min-w-0 flex-1"
                      autoFocus
                      disabled={pending}
                      onKeyDown={e => {
                        if (e.key === "Enter") void onSaveEdit(h.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
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
                  </>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">{h.title}</div>
                      <div className="text-[11px] tabular-nums text-muted-foreground">
                        {t.habits.streakLabel
                          .replace("{streak}", String(h.streak))
                          .replace("{best}", String(h.bestStreak))}
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
