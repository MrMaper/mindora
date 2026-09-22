"use client";

import * as React from "react";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { useTranslation } from "@/i18n/provider";
import { cn, formatNumber } from "@/lib/utils";

const PRESETS = [500, 1000, 2000, 3000, 5000] as const;

interface DocWordGoalDrawerProps {
  open: boolean;
  currentGoal: number | null;
  currentWords?: number;
  language?: "FA" | "EN";
  onClose: () => void;
  onSubmit: (wordGoal: number | null) => Promise<boolean>;
}

export function DocWordGoalDrawer({
  open,
  currentGoal,
  currentWords = 0,
  language = "FA",
  onClose,
  onSubmit,
}: DocWordGoalDrawerProps) {
  const t = useTranslation();
  const [value, setValue] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setValue(currentGoal && currentGoal > 0 ? String(currentGoal) : "1000");
    setError(null);
    setPending(false);
  }, [open, currentGoal]);

  async function save(next: number | null) {
    setPending(true);
    setError(null);
    try {
      const ok = await onSubmit(next);
      if (ok) onClose();
      else setError(t.common.error);
    } catch {
      setError(t.common.error);
    } finally {
      setPending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed === "") {
      await save(null);
      return;
    }
    const parsed = Number.parseInt(trimmed, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError(t.docs.wordGoalInvalid);
      return;
    }
    await save(parsed === 0 ? null : parsed);
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      header={
        <span className="text-sm font-semibold text-text-primary">
          {t.docs.wordGoalSet}
        </span>
      }
      footer={
        <div className="flex flex-wrap gap-2 ms-auto">
          {currentGoal ? (
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => void save(null)}
            >
              {t.docs.wordGoalClear}
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            {t.common.cancel}
          </Button>
          <Button
            variant="primary"
            loading={pending}
            type="submit"
            form="doc-word-goal-form"
          >
            {t.common.save}
          </Button>
        </div>
      }
    >
      <form
        id="doc-word-goal-form"
        onSubmit={e => void handleSubmit(e)}
        className="flex flex-col gap-4 py-2"
      >
        <p className="text-xs text-muted-foreground leading-6">
          {t.docs.wordGoalHint}
        </p>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="word-goal-input"
            className="text-xs font-medium text-muted-foreground"
          >
            {t.docs.wordGoal}
          </label>
          <Input
            id="word-goal-input"
            type="number"
            min={0}
            inputMode="numeric"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="1000"
            disabled={pending}
            autoFocus
          />
          <p className="text-[11px] text-muted-foreground">
            {t.docs.wordCount}: {formatNumber(currentWords, language)}
            {currentGoal
              ? ` · ${t.docs.wordGoal}: ${formatNumber(currentGoal, language)}`
              : ""}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {t.docs.wordGoalPresets}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(n => (
              <button
                key={n}
                type="button"
                disabled={pending}
                onClick={() => setValue(String(n))}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                  value === String(n)
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                {formatNumber(n, language)}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-xs text-[var(--status-blocked)]">{error}</p>
        )}
      </form>
    </Drawer>
  );
}
