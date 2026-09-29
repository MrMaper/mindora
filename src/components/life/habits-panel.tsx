"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { useTranslation } from "@/i18n/provider";
import {
  archiveHabitAction,
  createHabitAction,
  getHabitHeatmapAction,
  listHabitsAction,
  toggleHabitDoneAction,
  type HabitHeatDay,
  type HabitItem,
} from "@/features/habits/actions";
import {
  HabitHeatmap,
  HABIT_HEATMAP_WEEKS,
} from "@/components/life/habit-heatmap";
import { cn } from "@/lib/utils";

export function HabitsPanel({
  initialHabits = [],
}: {
  initialHabits?: HabitItem[];
}) {
  const t = useTranslation();
  const router = useRouter();
  const [habits, setHabits] = React.useState(initialHabits);
  const [title, setTitle] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [heatFilter, setHeatFilter] = React.useState("all");
  const [heatDays, setHeatDays] = React.useState<HabitHeatDay[]>([]);

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

  async function refresh() {
    const rows = await listHabitsAction();
    setHabits(rows);
    await loadHeat(heatFilter);
    router.refresh();
  }

  async function onAdd() {
    if (!title.trim()) return;
    setPending(true);
    const result = await createHabitAction({ title });
    setPending(false);
    if (result.success) {
      setTitle("");
      await refresh();
    } else if (result.error) {
      window.alert(result.error);
    }
  }

  async function onToggle(id: string) {
    setPending(true);
    await toggleHabitDoneAction(id);
    setPending(false);
    await refresh();
  }

  async function onArchive(id: string) {
    setPending(true);
    await archiveHabitAction(id);
    setPending(false);
    if (heatFilter === id) setHeatFilter("all");
    await refresh();
  }

  const canAdd = title.trim().length > 0 && !pending;

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-semibold">{t.habits.title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t.habits.hint}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
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

      <HabitHeatmap
        habits={habits}
        days={heatDays}
        filterId={heatFilter}
        onFilterChange={setHeatFilter}
      />

      {habits.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          {t.habits.empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {habits.map(h => (
            <li
              key={h.id}
              className="flex items-center gap-2 rounded-lg border px-3 py-2"
            >
              <button
                type="button"
                disabled={pending}
                onClick={() => void onToggle(h.id)}
                className={cn(
                  "h-5 w-5 rounded border flex items-center justify-center text-[11px]",
                  h.doneToday
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-accent",
                )}
                aria-label={h.doneToday ? t.habits.undoToday : t.habits.markToday}
              >
                {h.doneToday ? "✓" : ""}
              </button>
              <div className="min-w-0 flex-1">
                <div className="text-sm truncate">{h.title}</div>
                <div className="text-[11px] text-muted-foreground tabular-nums">
                  {t.habits.streakLabel
                    .replace("{streak}", String(h.streak))
                    .replace("{best}", String(h.bestStreak))}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => void onArchive(h.id)}
              >
                {t.habits.archive}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
