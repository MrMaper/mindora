"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import { Input } from "@/components/ui-kit/forms/input";
import { cn } from "@/lib/utils";

export interface PdfAnnotatorLabels {
  title: string;
  loading: string;
  loadError: string;
  pageOf: string; // "{current} / {total}"
  prevPage: string;
  nextPage: string;
  openExternal: string;
  selectionHint: string;
  saveQuote: string;
  quoteNote: string;
  pageNote: string; // "p. {n}" / "ص. {n}"
  cancel: string;
  saved: string;
  close: string;
  insertIntoDraft?: string;
  pickDraftDoc?: string;
  noDraftHint?: string;
}

interface PdfAnnotatorDialogProps {
  open: boolean;
  fileUrl: string;
  sourceTitle: string;
  labels: PdfAnnotatorLabels;
  onClose: () => void;
  draftDocs?: { id: string; title: string }[];
  insertIntoDocId?: string;
  onInsertIntoDocIdChange?: (id: string) => void;
  onSaveQuote: (input: {
    text: string;
    note?: string;
    page: number;
    insertIntoDocId?: string;
  }) => Promise<void>;
}

type PdfJsModule = typeof import("pdfjs-dist");

export function PdfAnnotatorDialog({
  open,
  fileUrl,
  sourceTitle,
  labels,
  onClose,
  draftDocs = [],
  insertIntoDocId,
  onInsertIntoDocIdChange,
  onSaveQuote,
}: PdfAnnotatorDialogProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const textLayerRef = React.useRef<HTMLDivElement | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  const [pdfjs, setPdfjs] = React.useState<PdfJsModule | null>(null);
  const [doc, setDoc] = React.useState<import("pdfjs-dist").PDFDocumentProxy | null>(
    null,
  );
  const [page, setPage] = React.useState(1);
  const [pageCount, setPageCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selection, setSelection] = React.useState("");
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [flash, setFlash] = React.useState<string | null>(null);
  const [scale] = React.useState(1.25);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void import("pdfjs-dist").then(mod => {
      if (cancelled) return;
      mod.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${mod.version}/build/pdf.worker.min.mjs`;
      setPdfjs(mod);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  React.useEffect(() => {
    if (!open || !pdfjs || !fileUrl) return;
    let cancelled = false;
    let loaded: import("pdfjs-dist").PDFDocumentProxy | null = null;
    setLoading(true);
    setError(null);
    setDoc(null);
    setPage(1);
    setSelection("");
    setNote("");

    void pdfjs
      .getDocument({ url: fileUrl, withCredentials: false })
      .promise.then(pdf => {
        if (cancelled) {
          void pdf.cleanup();
          return;
        }
        loaded = pdf;
        setDoc(pdf);
        setPageCount(pdf.numPages);
        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        console.error(err);
        setError(labels.loadError);
        setLoading(false);
      });

    return () => {
      cancelled = true;
      void loaded?.cleanup();
    };
  }, [open, pdfjs, fileUrl, labels.loadError]);

  React.useEffect(() => {
    if (!open || !doc || !pdfjs) return;
    let cancelled = false;

    void (async () => {
      const pdfPage = await doc.getPage(page);
      if (cancelled) return;

      const viewport = pdfPage.getViewport({ scale });
      const canvas = canvasRef.current;
      const textLayerDiv = textLayerRef.current;
      if (!canvas || !textLayerDiv) return;

      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      textLayerDiv.innerHTML = "";
      textLayerDiv.style.width = `${viewport.width}px`;
      textLayerDiv.style.height = `${viewport.height}px`;

      await pdfPage.render({
        canvasContext: context,
        viewport,
        canvas,
      }).promise;
      if (cancelled) return;

      const textContent = await pdfPage.getTextContent();
      if (cancelled) return;

      // pdfjs TextLayer API (v4+)
      const TextLayer = new pdfjs.TextLayer({
        textContentSource: textContent,
        container: textLayerDiv,
        viewport,
      });
      await TextLayer.render();
    })().catch(err => {
      console.error(err);
      if (!cancelled) setError(labels.loadError);
    });

    return () => {
      cancelled = true;
    };
  }, [open, doc, page, pdfjs, scale, labels.loadError]);

  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function captureSelection() {
    const root = textLayerRef.current;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !root) {
      setSelection("");
      return;
    }
    if (!root.contains(sel.anchorNode) || !root.contains(sel.focusNode)) {
      setSelection("");
      return;
    }
    const text = sel.toString().replace(/\s+/g, " ").trim();
    setSelection(text);
    if (text && !note) {
      setNote(labels.pageNote.replace("{n}", String(page)));
    }
  }

  async function handleSave(intoDraft: boolean) {
    const text = selection.trim();
    if (!text || busy) return;
    if (intoDraft && !insertIntoDocId) return;
    setBusy(true);
    try {
      await onSaveQuote({
        text,
        note: note.trim() || undefined,
        page,
        insertIntoDocId: intoDraft ? insertIntoDocId : undefined,
      });
      setFlash(labels.saved);
      setSelection("");
      window.getSelection()?.removeAllRanges();
      setTimeout(() => setFlash(null), 1800);
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  const pageLabel = labels.pageOf
    .replace("{current}", String(page))
    .replace("{total}", String(pageCount || "—"));

  return (
    <div
      className="fixed inset-0 z-80 flex flex-col bg-background/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={labels.title}
    >
      <header className="flex items-center gap-2 border-b px-3 py-2 shrink-0">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{labels.title}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {sourceTitle}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            icon="chevron-left"
            aria-label={labels.prevPage}
            disabled={page <= 1 || loading}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          />
          <span className="text-xs tabular-nums min-w-16 text-center">
            {pageLabel}
          </span>
          <IconButton
            icon="chevron-right"
            aria-label={labels.nextPage}
            disabled={page >= pageCount || loading}
            onClick={() => setPage(p => Math.min(pageCount, p + 1))}
          />
        </div>
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-primary hover:underline px-2"
        >
          {labels.openExternal}
        </a>
        <IconButton icon="x" aria-label={labels.close} onClick={onClose} />
      </header>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto bg-muted/40 p-4"
          onMouseUp={captureSelection}
          onKeyUp={captureSelection}
        >
          {loading && (
            <p className="text-sm text-muted-foreground text-center py-16">
              {labels.loading}
            </p>
          )}
          {error && (
            <p className="text-sm text-destructive text-center py-16">{error}</p>
          )}
          {!loading && !error && (
            <div className="mx-auto relative w-fit shadow-lg bg-white">
              <canvas ref={canvasRef} className="block" />
              <div
                ref={textLayerRef}
                className="pdf-text-layer absolute inset-0 overflow-hidden leading-none"
              />
            </div>
          )}
        </div>

        <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-s p-3 flex flex-col gap-3 shrink-0 bg-card">
          <p className="text-xs text-muted-foreground">{labels.selectionHint}</p>
          <textarea
            value={selection}
            onChange={e => setSelection(e.target.value)}
            rows={8}
            placeholder={labels.selectionHint}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm leading-6 resize-y min-h-32"
          />
          <Input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={labels.quoteNote}
          />
          {draftDocs.length > 0 && labels.insertIntoDraft ? (
            <div>
              <label className="text-[10px] text-muted-foreground">
                {labels.pickDraftDoc ?? labels.insertIntoDraft}
              </label>
              <select
                className="mt-0.5 h-8 w-full rounded-md border bg-background px-2 text-xs"
                value={insertIntoDocId ?? ""}
                onChange={e => onInsertIntoDocIdChange?.(e.target.value)}
              >
                {draftDocs.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>
          ) : labels.noDraftHint ? (
            <p className="text-[11px] text-muted-foreground">{labels.noDraftHint}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={busy || !selection.trim()}
              onClick={() => void handleSave(false)}
            >
              {labels.saveQuote}
            </Button>
            {draftDocs.length > 0 && labels.insertIntoDraft ? (
              <Button
                size="sm"
                variant="subtle"
                disabled={busy || !selection.trim() || !insertIntoDocId}
                onClick={() => void handleSave(true)}
              >
                {labels.insertIntoDraft}
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelection("");
                window.getSelection()?.removeAllRanges();
              }}
            >
              {labels.cancel}
            </Button>
          </div>
          {flash && (
            <p
              className={cn(
                "text-xs text-emerald-700 dark:text-emerald-400",
              )}
            >
              {flash}
            </p>
          )}
        </aside>
      </div>

      <style>{`
        .pdf-text-layer {
          opacity: 1;
          line-height: 1;
          mix-blend-mode: multiply;
        }
        .pdf-text-layer span,
        .pdf-text-layer br {
          color: transparent;
          position: absolute;
          white-space: pre;
          cursor: text;
          transform-origin: 0% 0%;
        }
        .pdf-text-layer ::selection {
          background: rgba(63, 76, 187, 0.35);
        }
      `}</style>
    </div>
  );
}
