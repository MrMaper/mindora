"use client";

import { Icon } from "@/components/ui-kit/foundation/icon";
import { useTranslation } from "@/i18n/provider";
import { openCapture } from "@/features/capture/open-capture";
import { cn } from "@/lib/utils";

export function QuickCapture({
  compact = false,
  dueDate,
  hint,
}: {
  compact?: boolean;
  showRecurrence?: boolean;
  dueDate?: string;
  hint?: string;
}) {
  const t = useTranslation();

  return (
    <button
      type="button"
      onClick={() => openCapture(dueDate ? { dueDate } : undefined)}
      className={cn(
        "flex w-full flex-col gap-1 rounded-lg border border-border-default bg-bg-surface px-3 py-2.5 text-start hover:bg-accent/40",
        compact && "py-2",
      )}
    >
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon name="plus" size={16} />
        <span className="min-w-0 flex-1 truncate">{t.dashboard.capturePlaceholder}</span>
        <kbd className="rounded border px-1.5 py-0.5 text-[10px] font-medium">N</kbd>
      </span>
    </button>
  );
}
