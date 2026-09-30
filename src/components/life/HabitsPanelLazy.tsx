"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { HabitHeatDay, HabitItem } from "@/features/habits/actions";

const HabitsPanelImpl = dynamic(
  () => import("./habits-panel").then(m => m.HabitsPanel),
  {
    ssr: false,
    loading: () => <HabitsPanelSkeleton />,
  },
);

function HabitsPanelSkeleton() {
  return (
    <section className="rounded-xl border bg-card p-4" aria-busy="true">
      <div className="mb-3 h-4 w-24 animate-pulse rounded bg-muted/50" />
      <div className="mb-3 h-3 w-40 animate-pulse rounded bg-muted/40" />
      <div className="mb-3 h-9 animate-pulse rounded-md bg-muted/40" />
      <div className="mb-3 h-[5.5rem] animate-pulse rounded-md bg-muted/30" />
      <div className="space-y-2">
        <div className="h-12 animate-pulse rounded-lg bg-muted/35" />
        <div className="h-12 animate-pulse rounded-lg bg-muted/30" />
      </div>
    </section>
  );
}

/** Keeps the Today main column free of the habits/heatmap client chunk until idle. */
export function HabitsPanelLazy({
  initialHabits = [],
  initialHeatDays = [],
}: {
  initialHabits?: HabitItem[];
  initialHeatDays?: HabitHeatDay[];
}) {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const arm = () => {
      if (!cancelled) setReady(true);
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(arm, { timeout: 1200 });
      return () => {
        cancelled = true;
        w.cancelIdleCallback?.(id);
      };
    }
    const t = window.setTimeout(arm, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  if (!ready) return <HabitsPanelSkeleton />;
  return (
    <HabitsPanelImpl
      initialHabits={initialHabits}
      initialHeatDays={initialHeatDays}
    />
  );
}
