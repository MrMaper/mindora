"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui-kit/forms/button";
import { StarterCaptureBox } from "@/components/life/starter-capture";
import { LiveNowClock } from "@/components/life/live-now-clock";
import { completePersonalTask } from "@/features/life/actions";
import {
  dismissProfileSuggestionAction,
  setUiProfileAction,
} from "@/features/onboarding/actions";
import type { TaskRow } from "@/features/tasks/types";
import { useLanguage } from "@/i18n/provider";
import { formatClock, formatJalaliDate, formatJalaliShort } from "@/lib/life";
import { shouldSuggestFull } from "@/lib/ui-profile";
import { cn } from "@/lib/utils";

interface StarterTodayProps {
  userName: string;
  todayKey: string;
  leftover: TaskRow[];
  today: TaskRow[];
  undated: TaskRow[];
  upcoming: TaskRow[];
  doneCount: number;
  firstCaptureAt: Date | null;
  suggestionDismissedAt: Date | null;
}

/** Day (when asked) plus clock, so «فردا ساعت ۱۰ دکتر» keeps its 10:00. */
function dueCaption(
  task: TaskRow,
  language: "FA" | "EN",
  withDay: boolean,
): string | null {
  if (!task.dueDate) return null;
  const due = new Date(task.dueDate);
  const clock = formatClock(due, language, task.durationMinutes);
  const day = withDay ? formatJalaliShort(due, language) : null;
  return [day, clock].filter(Boolean).join(" · ") || null;
}

function TaskLine({
  task,
  caption,
  pending,
  onDone,
}: {
  task: TaskRow;
  caption?: string | null;
  pending: boolean;
  onDone: (task: TaskRow) => void;
}) {
  const fa = useLanguage() !== "EN";
  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">{task.title}</p>
        {caption ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{caption}</p>
        ) : null}
      </div>
      <Button
        type="button"
        size="sm"
        variant="subtle"
        disabled={pending}
        onClick={() => onDone(task)}
      >
        {fa ? "انجام شد" : "Done"}
      </Button>
    </li>
  );
}

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border-default bg-bg-surface",
        className,
      )}
    >
      <h2 className="border-b border-border-subtle bg-bg-sunken px-4 py-2.5 text-sm font-semibold">
        {title}
      </h2>
      <ul className="divide-y divide-border-subtle">{children}</ul>
    </section>
  );
}

/**
 * Starter Today (docs/AREAS.md §6.6, §15.1): a prompt, one list, «به‌زودی»,
 * leftovers from earlier days. No priorities, focus, charts or attention chips.
 */
export function StarterToday({
  userName,
  leftover,
  today,
  undated,
  upcoming,
  doneCount,
  firstCaptureAt,
  suggestionDismissedAt,
}: StarterTodayProps) {
  const language = useLanguage();
  const fa = language !== "EN";
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [suggestionHidden, setSuggestionHidden] = React.useState(false);

  const listNow = [...today, ...undated];
  const isEmpty =
    leftover.length === 0 && listNow.length === 0 && upcoming.length === 0;

  function onDone(task: TaskRow) {
    startTransition(async () => {
      const result = await completePersonalTask(task.id);
      if (!result?.success) {
        toast.error(result?.error ?? (fa ? "انجام نشد" : "Could not complete"));
        return;
      }
      router.refresh();
    });
  }

  function switchToFull() {
    startTransition(async () => {
      const res = await setUiProfileAction("full");
      if (!res.success) {
        toast.error(res.error ?? (fa ? "انجام نشد" : "Failed"));
        return;
      }
      router.refresh();
    });
  }

  function dismissSuggestion() {
    setSuggestionHidden(true);
    startTransition(async () => {
      await dismissProfileSuggestionAction();
    });
  }

  const suggest =
    !suggestionHidden &&
    shouldSuggestFull({
      profile: "starter",
      doneCount,
      dismissedAt: suggestionDismissedAt,
    });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-text-primary">
          {fa ? "سلام" : "Hello"}
          {userName ? `، ${userName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="inline-block max-w-full whitespace-nowrap">
            {formatJalaliDate(new Date(), language === "EN" ? "EN" : "FA")}
            <span className="mx-1 opacity-40" aria-hidden>
              ·
            </span>
            <LiveNowClock className="text-sm font-semibold text-foreground" />
          </span>
        </p>
      </div>

      <StarterCaptureBox askLifePart={!firstCaptureAt} />

      {isEmpty ? (
        <p className="rounded-xl border border-dashed border-border-default px-4 py-6 text-center text-sm text-muted-foreground">
          {fa
            ? "هنوز چیزی ننوشتی. اولین کارت را بنویس."
            : "You haven't written anything yet. Write your first one."}
        </p>
      ) : null}

      {leftover.length > 0 ? (
        <Section title={fa ? "از دیروز و قبل‌تر" : "From yesterday and earlier"}>
          {leftover.map(task => (
            <TaskLine
              key={task.id}
              task={task}
              pending={pending}
              onDone={onDone}
              caption={dueCaption(task, language === "EN" ? "EN" : "FA", true)}
            />
          ))}
        </Section>
      ) : null}

      {listNow.length > 0 ? (
        <Section title={fa ? "امروز" : "Today"}>
          {listNow.map(task => (
            <TaskLine
              key={task.id}
              task={task}
              pending={pending}
              onDone={onDone}
              caption={dueCaption(task, language === "EN" ? "EN" : "FA", false)}
            />
          ))}
        </Section>
      ) : null}

      {upcoming.length > 0 ? (
        <Section title={fa ? "به‌زودی" : "Coming up"}>
          {upcoming.map(task => (
            <TaskLine
              key={task.id}
              task={task}
              pending={pending}
              onDone={onDone}
              caption={dueCaption(task, language === "EN" ? "EN" : "FA", true)}
            />
          ))}
        </Section>
      ) : null}

      {suggest ? (
        <section
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3"
          aria-label={fa ? "پیشنهاد" : "Suggestion"}
        >
          <p className="min-w-0 text-sm">
            {fa
              ? "چند کار انجام دادی. می‌خواهی قابلیت‌های بیشتری ببینی؟"
              : "You've finished a few tasks. Want to see more features?"}
          </p>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="primary" disabled={pending} onClick={switchToFull}>
              {fa ? "نشان بده" : "Show me"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={dismissSuggestion}>
              {fa ? "الان نه" : "Not now"}
            </Button>
          </div>
        </section>
      ) : null}

      <footer className="flex justify-center pb-2 pt-1">
        <button
          type="button"
          disabled={pending}
          onClick={switchToFull}
          className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-60"
        >
          {fa ? "قابلیت‌های بیشتر نشان بده" : "Show more features"}
        </button>
      </footer>
    </div>
  );
}
