"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import {
  HabitHeatmap,
  HABIT_HEATMAP_WEEKS,
} from "@/components/life/habit-heatmap";
import { cn } from "@/lib/utils";

type HabitsView = "active" | "archived";

export function HabitsPanel({
  initialHabits = [],
}: {
  initialHabits?: HabitItem[];
}) {
  const t = useTranslation();
  const router = useRouter();
  const [view, setView] = React.useState<HabitsView>("active");
  const [habits, setHabits] = React.useState(initialHabits);
  const [archivedHabits, setArchivedHabits] = React.useState<HabitItem[]>([]);
  const [title, setTitle] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [heatFilter, setHeatFilter] = React.useState("all");
  const [heatDays, setHeatDays] = React.useState<HabitHeatDay[]>([]);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");

  React.useEffect(() => {
    setHabits(initialHabits);
  }, [initialHabits]);

  React.useEffect(() => {
    void getHabitHeatmapAction({
      habitId: heatFilter === "all" ? null : heatFilter,
      weeks: HABIT_HEATMAP_WEEKS,
    }).then(setHeatDays);
  }, [heatFilter]);

  async function loadHeat(filter: string) {
    const days = await getHabitHeatmapAction({
      habitId: filter === "all" ? null : filter,
      weeks: HABIT_HEATMAP_WEEKS,
    });
    setHeatDays(days);
  }

  async function refresh(nextView: HabitsView = view) {
    if (nextView === "archived") {
      const rows = await listHabitsAction({ archived: true });
      setArchivedHabits(rows);
    } else {
      const rows = await listHabitsAction();
      setHabits(rows);
      await loadHeat(heatFilter);
    }
    router.refresh();
  }

  async function switchView(next: HabitsView) {
    setEditingId(null);
    setView(next);
    setPending(true);
    await refresh(next);
    setPending(false);
  }

  async function onAdd() {
    if (!title.trim()) return;
    setPending(true);
    const result = await createHabitAction({ title });
    setPending(false);
    if (result.success) {
      setTitle("");
      if (view !== "active") setView("active");
      await refresh("active");
    } else if (result.error) {
      window.alert(result.error);
    }
  }

  async function onToggle(id: string) {
    setPending(true);
    await toggleHabitDoneAction(id);
    setPending(false);
    await refresh("active");
  }

  async function onArchive(id: string) {
    setPending(true);
    await archiveHabitAction(id);
    setPending(false);
    if (heatFilter === id) setHeatFilter("all");
    if (editingId === id) setEditingId(null);
    await refresh("active");
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
    await refresh("archived");
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
    await refresh(view);
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
    await refresh(view);
  }

  const canAdd = title.trim().length > 0 && !pending;
  const list = view === "archived" ? archivedHabits : habits;

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
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
        <HabitHeatmap
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
