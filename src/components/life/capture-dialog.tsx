"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog } from "@/components/ui-kit/overlays/dialog";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { addDays, formatJalaliShort, parseLocalDate, startOfDay, toDateKey } from "@/lib/life";
import { cn, formatNumber } from "@/lib/utils";
import type { LifeArea, RecurrenceInterval } from "@/types/db";
import { universalCapture } from "@/features/capture/actions";
import { captureProduct, parseCapture } from "@/features/capture/parse";
import { formatDurationLabel } from "@/components/ui-kit/forms/time-roller";
import { RESEARCH_SCOPE_STORAGE } from "@/features/research/scope-cookie";

const AREAS: LifeArea[] = ["PHD", "WORK", "LIFE", "LANG"];

export function CaptureDialog({
  fallbackDate,
  onClose,
}: {
  fallbackDate?: string;
  onClose: () => void;
}) {
  const t = useTranslation();
  const language = useLanguage();
  const router = useRouter();
  const [text, setText] = React.useState("");
  const [areaLock, setAreaLock] = React.useState<LifeArea | null>(null);
  const [pending, startTransition] = React.useTransition();
  const parsed = parseCapture(text);
  const product = captureProduct(parsed);
  const area = areaLock ?? parsed.area;
  const showSchedule =
    product === "task" || product === "source" || product === "research";
  const dateKey =
    parsed.dateKey ?? (showSchedule ? fallbackDate : undefined);

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
    return null;
  }

  function dateLabel(key: string | undefined) {
    if (!key) return null;
    const today = toDateKey(new Date());
    const tomorrow = toDateKey(addDays(startOfDay(new Date()), 1));
    if (key === today) return t.dashboard.today;
    if (key === tomorrow) return t.dashboard.captureTomorrow;
    return formatJalaliShort(parseLocalDate(key), language);
  }

  const kindLabel =
    product === "note"
      ? t.dashboard.captureKindNote
      : product === "habit"
        ? t.dashboard.captureKindHabit
        : product === "source"
          ? t.dashboard.captureKindSource
          : product === "research"
            ? t.dashboard.captureKindResearch
            : t.dashboard.captureKindTask;

  let pathChip: string | null = null;
  if (product === "source" || product === "research") {
    try {
      const scope =
        typeof window !== "undefined"
          ? localStorage.getItem(RESEARCH_SCOPE_STORAGE)
          : null;
      if (!scope || scope === "all" || scope === "inbox") {
        pathChip = t.dashboard.capturePathInbox;
      } else {
        pathChip = t.dashboard.capturePathActive;
      }
    } catch {
      pathChip = t.dashboard.capturePathInbox;
    }
  }

  const chips = [
    ...new Set(
      [
        kindLabel,
        areaLabel(area),
        pathChip,
        showSchedule ? dateLabel(dateKey) : null,
        showSchedule && parsed.time
          ? formatNumber(parsed.time, language)
          : null,
        showSchedule && parsed.durationMinutes
          ? formatDurationLabel(
              parsed.durationMinutes,
              language === "EN" ? "EN" : "FA",
            )
          : null,
        recurrenceLabel(parsed.recurrence),
      ].filter((chip): chip is string => Boolean(chip)),
    ),
  ];

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!parsed.title.trim()) return;
    startTransition(async () => {
      const result = await universalCapture({
        text,
        areaOverride: areaLock,
        dueDateFallback: showSchedule ? fallbackDate : undefined,
        timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      });
      if (!result.success || !result.data) {
        toast.error(result.error ?? t.common.error);
        return;
      }
      toast.success(t.common.success);
      onClose();
      if (result.data.kind === "note") {
        router.push(`/docs?id=${result.data.id}`);
        return;
      }
      if (result.data.product === "source" || result.data.product === "research") {
        router.push("/research?tab=library");
        return;
      }
      router.refresh();
    });
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={t.dashboard.captureOpen}
      width={480}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button
            type="submit"
            form="universal-capture"
            variant="primary"
            loading={pending}
            disabled={!parsed.title.trim()}
          >
            {t.dashboard.capture}
          </Button>
        </>
      }
    >
      <form id="universal-capture" onSubmit={onSubmit} className="flex flex-col gap-3">
        <Input
          autoFocus
          value={text}
          onChange={event => setText(event.target.value)}
          placeholder={t.dashboard.capturePlaceholder}
          icon="plus"
        />
        <p dir="ltr" className="text-left text-xs text-muted-foreground">
          {t.dashboard.captureHint}
        </p>
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium text-text-primary">
            {t.dashboard.captureGuide}
          </summary>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 ps-4">
            <li>{t.dashboard.captureGuideKind}</li>
            <li>{t.dashboard.captureGuideDate}</li>
            <li>{t.dashboard.captureGuideTime}</li>
            <li>{t.dashboard.captureGuideArea}</li>
            <li>{t.dashboard.captureGuideStore}</li>
          </ul>
        </details>
        {text.trim() ? (
          <div className="flex flex-col gap-2">
            {parsed.title.trim() ? (
              <p className="text-xs text-muted-foreground">
                {t.dashboard.captureSaved}
                {": "}
                <span className="text-text-primary">{parsed.title.trim()}</span>
              </p>
            ) : null}
            <div className="flex flex-wrap gap-1.5">
              {chips.map(chip => (
                <span
                  key={chip}
                  className="rounded-full border border-border-default bg-bg-sunken px-2 py-0.5 text-xs"
                >
                  {chip}
                </span>
              ))}
              {showSchedule && !parsed.dateKey && fallbackDate ? (
                <span className="rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground">
                  {t.dashboard.captureDefault}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setAreaLock(null)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs",
                  areaLock === null
                    ? "border-primary bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                {t.dashboard.captureAuto}
              </button>
              {AREAS.map(value => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAreaLock(value)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs",
                    areaLock === value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  {areaLabel(value)}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </form>
    </Dialog>
  );
}
