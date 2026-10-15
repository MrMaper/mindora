"use client";

import * as React from "react";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { ResolvedValidationText } from "@/components/ui-kit/forms/action-error";
import { Button } from "@/components/ui-kit/forms/button";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { cn, formatNumber } from "@/lib/utils";

export type MoveAreaTarget = {
  areaId: string;
  name: string;
};

export type MoveAreaCounts = {
  tasks: number;
  docs: number;
  habits: number;
  paths: number;
};

interface MoveAreaContentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "move" | "merge";
  sourceName: string;
  targets: MoveAreaTarget[];
  counts: MoveAreaCounts | null;
  loadingPreview: boolean;
  isPending: boolean;
  actionError: string | null;
  onConfirm: (toAreaId: string) => void;
}

export function MoveAreaContentDrawer({
  isOpen,
  onClose,
  mode,
  sourceName,
  targets,
  counts,
  loadingPreview,
  isPending,
  actionError,
  onConfirm,
}: MoveAreaContentDrawerProps) {
  const t = useTranslation();
  const language = useLanguage();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    setSelectedId(null);
  }, [isOpen]);

  const title =
    mode === "merge"
      ? (t.projects.mergeConfirm ?? "ادغام / حذف حوزه")
      : (t.projects.moveAllConfirm ?? "انتقال همه به حوزهٔ دیگر");

  const confirmLabel =
    mode === "merge"
      ? (t.projects.mergeAndDelete ?? "ادغام و حذف")
      : (t.projects.moveAllAction ?? "انتقال همه");

  const fmt = (n: number) => formatNumber(n, language);
  const summary = counts
    ? t.projects.moveSummary
        .replace("{tasks}", fmt(counts.tasks))
        .replace("{docs}", fmt(counts.docs))
        .replace("{habits}", fmt(counts.habits))
        .replace("{paths}", fmt(counts.paths))
    : null;

  const selected = targets.find(x => x.areaId === selectedId) ?? null;

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      header={
        <span className="text-sm font-semibold text-foreground">{title}</span>
      }
      footer={
        <div className="flex flex-col gap-2 w-full">
          {selected ? (
            <p className="text-xs text-muted-foreground">
              {t.projects.moveAllFinalConfirm}
              {" → "}
              <span className="text-foreground font-medium">{selected.name}</span>
            </p>
          ) : null}
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" onClick={onClose} disabled={isPending}>
              {t.common.cancel}
            </Button>
            <Button
              variant={mode === "merge" ? "danger" : "primary"}
              loading={isPending}
              disabled={!selectedId || isPending || targets.length === 0}
              onClick={() => {
                if (selectedId) onConfirm(selectedId);
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      }
    >
      <div className="p-4 flex flex-col gap-4">
        {actionError ? (
          <div
            className="auth-card__alert auth-card__alert--error"
            role="alert"
          >
            <ResolvedValidationText text={actionError} />
          </div>
        ) : null}

        <div className="rounded-lg border border-border-default bg-bg-sunken px-3 py-2.5">
          <p className="text-xs text-muted-foreground mb-0.5">
            {t.projects.moveFromLabel}
          </p>
          <p className="text-sm font-medium text-foreground">{sourceName}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {loadingPreview
              ? t.common.loading
              : (summary ?? t.projects.noMoveCounts)}
          </p>
        </div>

        {targets.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t.projects.noMoveTarget}
          </p>
        ) : (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {t.projects.pickMoveTarget}
            </p>
            <div className="flex flex-col gap-1.5">
              {targets.map(target => {
                const active = selectedId === target.areaId;
                return (
                  <button
                    key={target.areaId}
                    type="button"
                    disabled={isPending}
                    onClick={() => setSelectedId(target.areaId)}
                    className={cn(
                      "w-full text-start rounded-lg border px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border-default hover:bg-bg-hover text-foreground",
                    )}
                  >
                    {target.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
