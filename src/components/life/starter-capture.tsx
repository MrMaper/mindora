"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog } from "@/components/ui-kit/overlays/dialog";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { useLanguage } from "@/i18n/provider";
import { universalCapture } from "@/features/capture/actions";
import { chooseLifePartAction } from "@/features/onboarding/actions";
import { LIFE_PART_CHIPS, LIFE_PART_LABEL, type LifePartChip } from "@/lib/ui-profile";
import { cn } from "@/lib/utils";

/**
 * Starter capture: one plain box, Enter saves (docs/AREAS.md §6.6, S-6).
 * On the member's very first save it asks «این مال کدوم قسمت زندگیته؟» once;
 * closing that prompt leaves the task in the default area.
 */
export function StarterCaptureDialog({
  fallbackDate,
  askLifePart,
  onClose,
}: {
  fallbackDate?: string;
  askLifePart?: boolean;
  onClose: () => void;
}) {
  const fa = useLanguage() !== "EN";
  return (
    <Dialog
      open
      onClose={onClose}
      title={fa ? "الان چیکار داری؟" : "What's on your mind?"}
      width={480}
    >
      <StarterCaptureBox
        autoFocus
        askLifePart={askLifePart}
        fallbackDate={fallbackDate}
        onDone={onClose}
      />
    </Dialog>
  );
}

export function StarterCaptureBox({
  autoFocus = false,
  askLifePart = false,
  fallbackDate,
  onDone,
  className,
}: {
  autoFocus?: boolean;
  /** True only before the member has ever captured anything. */
  askLifePart?: boolean;
  fallbackDate?: string;
  /** Called when the whole flow (save, optional chip step) is finished. */
  onDone?: () => void;
  className?: string;
}) {
  const fa = useLanguage() !== "EN";
  const router = useRouter();
  const [text, setText] = React.useState("");
  const [savedTaskId, setSavedTaskId] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  // Ask at most once per mounted box, and only for the first-ever capture.
  const askedRef = React.useRef(false);

  function finish() {
    setSavedTaskId(null);
    setText("");
    router.refresh();
    onDone?.();
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = text.trim();
    if (!value || pending) return;
    startTransition(async () => {
      const result = await universalCapture({
        text: value,
        plain: true,
        dueDateFallback: fallbackDate,
        timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      });
      if (!result.success || !result.data) {
        toast.error(result.error ?? (fa ? "ثبت نشد" : "Could not save"));
        return;
      }
      if (askLifePart && !askedRef.current) {
        askedRef.current = true;
        setSavedTaskId(result.data.id);
        router.refresh();
        return;
      }
      toast.success(fa ? "ثبت شد." : "Saved.");
      finish();
    });
  }

  function onChip(chip: LifePartChip) {
    const taskId = savedTaskId;
    if (!taskId) return;
    startTransition(async () => {
      const res = await chooseLifePartAction({ taskId, chip });
      if (!res.success) {
        toast.error(res.error ?? (fa ? "انجام نشد" : "Failed"));
      } else {
        const label = fa ? LIFE_PART_LABEL[chip].fa : LIFE_PART_LABEL[chip].en;
        toast.success(fa ? `در «${label}» ذخیره شد.` : `Saved under "${label}".`);
      }
      finish();
    });
  }

  if (savedTaskId) {
    return (
      <div className={cn("flex flex-col gap-3", className)} role="status">
        <p className="text-sm font-medium text-foreground">
          {fa ? "ثبت شد." : "Saved."}
        </p>
        <p className="text-sm text-muted-foreground">
          {fa ? "این مال کدوم قسمت زندگیته؟" : "Which part of life is this?"}
        </p>
        <div className="flex flex-wrap gap-2">
          {LIFE_PART_CHIPS.map(chip => (
            <button
              key={chip}
              type="button"
              disabled={pending}
              onClick={() => onChip(chip)}
              className="min-h-11 rounded-full border border-border-default bg-bg-surface px-4 text-sm hover:bg-accent disabled:opacity-60"
            >
              {fa ? LIFE_PART_LABEL[chip].fa : LIFE_PART_LABEL[chip].en}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {fa ? "بعداً می‌توانی عوضش کنی." : "You can change this later."}
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={finish}>
            {fa ? "الان نه" : "Not now"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Input
            autoFocus={autoFocus}
            value={text}
            onChange={event => setText(event.target.value)}
            placeholder={fa ? "الان چیکار داری؟" : "What's on your mind?"}
            icon="plus"
            aria-label={fa ? "الان چیکار داری؟" : "What's on your mind?"}
          />
        </div>
        <Button type="submit" variant="primary" loading={pending} disabled={!text.trim()}>
          {fa ? "ثبت" : "Save"}
        </Button>
      </div>
    </form>
  );
}
