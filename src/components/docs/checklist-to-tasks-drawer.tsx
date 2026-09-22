"use client";

import * as React from "react";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { Button } from "@/components/ui-kit/forms/button";
import { useTranslation } from "@/i18n/provider";
import { cn, formatNumber } from "@/lib/utils";

interface ChecklistToTasksDrawerProps {
  open: boolean;
  candidates: string[];
  language?: "FA" | "EN";
  onClose: () => void;
  onConfirm: (titles: string[]) => Promise<boolean>;
}

export function ChecklistToTasksDrawer({
  open,
  candidates,
  language = "FA",
  onClose,
  onConfirm,
}: ChecklistToTasksDrawerProps) {
  const t = useTranslation();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setSelected(new Set(candidates));
    setPending(false);
    setError(null);
  }, [open, candidates]);

  const allSelected =
    candidates.length > 0 && candidates.every(c => selected.has(c));

  function toggle(title: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(candidates));
  }

  async function handleConfirm() {
    const titles = candidates.filter(c => selected.has(c));
    if (titles.length === 0) {
      setError(t.docs.checklistPickOne);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const ok = await onConfirm(titles);
      if (ok) onClose();
      else setError(t.common.error);
    } catch {
      setError(t.common.error);
    } finally {
      setPending(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      header={
        <span className="text-sm font-semibold text-text-primary">
          {t.docs.checklistPreviewTitle}
        </span>
      }
      footer={
        <div className="flex gap-2 ms-auto">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            {t.common.cancel}
          </Button>
          <Button
            variant="primary"
            loading={pending}
            disabled={selected.size === 0}
            onClick={() => void handleConfirm()}
          >
            {t.docs.checklistConfirmCreate} (
            {formatNumber(selected.size, language)})
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 py-2">
        <p className="text-xs text-muted-foreground leading-6">
          {t.docs.checklistPreviewHint}
        </p>

        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t.docs.checklistEmpty}
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {formatNumber(candidates.length, language)} {t.docs.checklistFound}
              </span>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={toggleAll}
                disabled={pending}
              >
                {allSelected
                  ? t.docs.checklistDeselectAll
                  : t.docs.checklistSelectAll}
              </button>
            </div>
            <ul className="flex flex-col gap-1.5 max-h-[50dvh] overflow-auto">
              {candidates.map((title, index) => {
                const checked = selected.has(title);
                return (
                  <li key={`${index}-${title}`}>
                    <label
                      className={cn(
                        "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors",
                        checked
                          ? "border-primary/35 bg-primary/5"
                          : "hover:bg-accent/60",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 size-4 accent-[var(--brand-600)]"
                        checked={checked}
                        disabled={pending}
                        onChange={() => toggle(title)}
                      />
                      <span className="text-sm leading-6 min-w-0">{title}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {error && (
          <p className="text-xs text-[var(--status-blocked)]">{error}</p>
        )}
      </div>
    </Drawer>
  );
}
