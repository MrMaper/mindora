"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { formatJalaliShort } from "@/lib/life";
import { cn, formatNumber } from "@/lib/utils";
import type { DocVersionItem } from "@/features/docs/types";
import { getDocVersionContentAction } from "@/features/docs/actions";
import {
  diffWords,
  htmlToPlainText,
  type DiffPart,
} from "@/features/docs/utils";

const CURRENT_ID = "current";

type PaneSource = {
  id: string;
  title: string;
  html: string;
  text: string;
};

export function VersionCompareModal({
  docId,
  currentTitle,
  currentContent,
  versions,
  open,
  initialRightId,
  onClose,
  onRestore,
}: {
  docId: string;
  currentTitle: string;
  currentContent: string;
  versions: DocVersionItem[];
  open: boolean;
  initialRightId?: string | null;
  onClose: () => void;
  onRestore: (versionId: string) => Promise<void>;
}) {
  const t = useTranslation();
  const language = useLanguage();
  const [leftId, setLeftId] = React.useState(CURRENT_ID);
  const [rightId, setRightId] = React.useState<string>("");
  const [left, setLeft] = React.useState<PaneSource | null>(null);
  const [right, setRight] = React.useState<PaneSource | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [mode, setMode] = React.useState<"diff" | "side">("diff");

  const loadPane = React.useCallback(
    async (id: string): Promise<PaneSource | null> => {
      if (id === CURRENT_ID) {
        return {
          id: CURRENT_ID,
          title: currentTitle,
          html: currentContent,
          text: htmlToPlainText(currentContent),
        };
      }
      const v = await getDocVersionContentAction(docId, id);
      if (!v) return null;
      return {
        id: v.id,
        title: v.title,
        html: v.content,
        text: htmlToPlainText(v.content),
      };
    },
    [currentContent, currentTitle, docId],
  );

  React.useEffect(() => {
    if (!open) return;
    const preferred =
      initialRightId && versions.some(v => v.id === initialRightId)
        ? initialRightId
        : (versions[0]?.id ?? "");
    setLeftId(CURRENT_ID);
    setRightId(preferred);
    setMode("diff");
  }, [open, initialRightId, versions]);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const [l, r] = await Promise.all([
        loadPane(leftId),
        rightId ? loadPane(rightId) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      setLeft(l);
      setRight(r);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, leftId, rightId, loadPane]);

  const parts: DiffPart[] = React.useMemo(() => {
    if (!left || !right) return [];
    return diffWords(left.text, right.text);
  }, [left, right]);

  const restoreTargetId =
    rightId && rightId !== CURRENT_ID
      ? rightId
      : leftId !== CURRENT_ID
        ? leftId
        : "";

  if (!open) return null;

  function versionOptionLabel(v: DocVersionItem) {
    const kind =
      v.note === "auto"
        ? t.docs.versionAuto
        : v.note === "before-restore"
          ? t.docs.versionBeforeRestore
          : v.note && v.note !== "manual"
            ? v.note
            : t.docs.versionManual;
    return `${formatJalaliShort(new Date(v.createdAt), language)} · ${kind} · ${formatNumber(v.wordCount, language)} ${t.docs.wordCount}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label={t.docs.close}
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-5xl max-h-[90dvh] overflow-hidden rounded-2xl border bg-card shadow-xl flex flex-col">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <h2 className="text-base font-semibold">{t.docs.compareVersions}</h2>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border p-0.5 text-xs">
              <button
                type="button"
                className={cn(
                  "rounded-md px-2.5 py-1",
                  mode === "diff" && "bg-primary/10 text-primary",
                )}
                onClick={() => setMode("diff")}
              >
                {t.docs.compareDiff}
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-md px-2.5 py-1",
                  mode === "side" && "bg-primary/10 text-primary",
                )}
                onClick={() => setMode("side")}
              >
                {t.docs.compareSideBySide}
              </button>
            </div>
            <IconButton icon="x" aria-label={t.docs.close} onClick={onClose} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 p-4 border-b">
          <label className="text-xs flex flex-col gap-1">
            <span className="text-muted-foreground">{t.docs.compareBase}</span>
            <select
              className="h-9 rounded-md border bg-background text-sm"
              value={leftId}
              onChange={e => setLeftId(e.target.value)}
            >
              <option value={CURRENT_ID}>
                {t.docs.currentVersion} · {currentTitle}
              </option>
              {versions.map(v => (
                <option key={v.id} value={v.id}>
                  {versionOptionLabel(v)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs flex flex-col gap-1">
            <span className="text-muted-foreground">{t.docs.compareTarget}</span>
            <select
              className="h-9 rounded-md border bg-background text-sm"
              value={rightId}
              onChange={e => setRightId(e.target.value)}
            >
              <option value={CURRENT_ID}>
                {t.docs.currentVersion} · {currentTitle}
              </option>
              {versions.map(v => (
                <option key={v.id} value={v.id}>
                  {versionOptionLabel(v)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground">{t.common.loading}</p>
          ) : mode === "diff" ? (
            <div className="h-full overflow-auto p-4 text-sm leading-7">
              <p className="text-[11px] text-muted-foreground mb-3">
                {t.docs.compareDiffHint}
              </p>
              <p className="whitespace-pre-wrap break-words">
                {parts.map((part, idx) => (
                  <span
                    key={idx}
                    className={cn(
                      part.type === "add" &&
                        "bg-[var(--status-done)]/20 text-foreground rounded-sm px-0.5",
                      part.type === "del" &&
                        "bg-[var(--status-blocked)]/20 text-foreground line-through rounded-sm px-0.5",
                    )}
                  >
                    {part.text}{" "}
                  </span>
                ))}
              </p>
              {parts.length === 0 && (
                <p className="text-muted-foreground">{t.docs.compareNoDiff}</p>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-0 h-full min-h-0">
              <div
                className="overflow-auto p-4 text-sm leading-7 border-e prose-docs"
                dangerouslySetInnerHTML={{ __html: left?.html ?? "" }}
              />
              <div
                className="overflow-auto p-4 text-sm leading-7 prose-docs"
                dangerouslySetInnerHTML={{ __html: right?.html ?? "" }}
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t px-4 py-3">
          <Button variant="subtle" onClick={onClose}>
            {t.docs.close}
          </Button>
          <Button
            variant="primary"
            disabled={!restoreTargetId || busy}
            onClick={async () => {
              if (!restoreTargetId) return;
              if (!window.confirm(t.docs.restoreConfirm)) return;
              setBusy(true);
              try {
                await onRestore(restoreTargetId);
                onClose();
              } finally {
                setBusy(false);
              }
            }}
          >
            {t.docs.restoreVersion}
          </Button>
        </div>
      </div>
    </div>
  );
}
