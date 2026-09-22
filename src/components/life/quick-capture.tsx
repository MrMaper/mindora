"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { useTranslation } from "@/i18n/provider";
import { quickCapture } from "@/features/life/actions";
import type { LifeArea, RecurrenceInterval } from "@/types/db";
import { cn } from "@/lib/utils";

const AREAS: LifeArea[] = ["PHD", "WORK", "LIFE", "LANG"];
const RECURRENCE: RecurrenceInterval[] = ["NONE", "WEEKLY", "DAILY", "MONTHLY"];

export function QuickCapture({
  compact = false,
  showRecurrence = true,
  dueDate,
  hint,
}: {
  compact?: boolean;
  showRecurrence?: boolean;
  dueDate?: string;
  hint?: string;
}) {
  const t = useTranslation();
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [area, setArea] = React.useState<LifeArea>("LIFE");
  const [recurrence, setRecurrence] = React.useState<RecurrenceInterval>("NONE");
  const [pending, startTransition] = React.useTransition();

  function areaLabel(value: LifeArea) {
    if (value === "PHD") return t.dashboard.areaPhd;
    if (value === "WORK") return t.dashboard.areaWork;
    if (value === "LANG") return t.dashboard.areaLang;
    return t.dashboard.areaLife;
  }

  function recurrenceLabel(value: RecurrenceInterval) {
    if (value === "DAILY") return t.dashboard.recurrenceDaily;
    if (value === "WEEKLY") return t.dashboard.recurrenceWeekly;
    if (value === "MONTHLY") return t.dashboard.recurrenceMonthly;
    return t.dashboard.recurrenceNone;
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      const result = await quickCapture({ title, area, recurrence, dueDate });
      if (!result.success) {
        toast.error(result.error ?? t.common.error);
        return;
      }
      setTitle("");
      toast.success(t.common.success);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "bg-bg-surface border border-border-default rounded-lg p-3 flex flex-col gap-3",
        compact && "p-2.5",
      )}
    >
      {hint ? (
        <p className="text-xs text-muted-foreground px-0.5">{hint}</p>
      ) : null}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={title}
            onChange={event => setTitle(event.target.value)}
            placeholder={t.dashboard.capturePlaceholder}
            icon="plus"
          />
        </div>
        <Button type="submit" variant="primary" loading={pending}>
          {t.dashboard.capture}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {AREAS.map(value => (
          <button
            key={value}
            type="button"
            onClick={() => setArea(value)}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
              area === value
                ? "bg-primary text-primary-foreground border-primary"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {areaLabel(value)}
          </button>
        ))}
        {showRecurrence ? (
          <>
            <span className="w-px bg-border mx-1" />
            {RECURRENCE.map(value => (
              <button
                key={value}
                type="button"
                onClick={() => setRecurrence(value)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                  recurrence === value
                    ? "bg-accent text-foreground border-border"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                {recurrenceLabel(value)}
              </button>
            ))}
          </>
        ) : null}
      </div>
    </form>
  );
}
