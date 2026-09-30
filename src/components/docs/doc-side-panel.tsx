"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import { Input } from "@/components/ui-kit/forms/input";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { cn, formatNumber } from "@/lib/utils";
import { formatJalaliShort } from "@/lib/life";
import { scrollDocEditorToHeading } from "@/components/docs/scroll-heading";
import { PdfAnnotatorDialog } from "@/components/docs/pdf-annotator-dialog";
import type { OutlineHeading } from "@/features/docs/utils";
import type {
  DocDetail,
  DocQuoteItem,
  DocSourceItem,
  DocVersionItem,
} from "@/features/docs/types";

type SideTab = "outline" | "tasks" | "sources" | "versions";

export function DocSidePanel({
  doc,
  outline,
  taskQuery,
  taskHits,
  onTaskQueryChange,
  onLinkTask,
  onUnlinkTask,
  onCreateTask,
  onAddSource,
  onUpdateSource,
  onDeleteSource,
  onAttachSourcePdf,
  onClearSourcePdf,
  onAddQuote,
  onUpdateQuote,
  onDeleteQuote,
  onInsertQuote,
  onSaveVersion,
  onRestoreVersion,
  onChecklistToTasks,
  onCompareVersions,
  className,
}: {
  doc: DocDetail | null;
  outline: OutlineHeading[];
  taskQuery: string;
  taskHits: { id: string; title: string }[];
  onTaskQueryChange: (q: string) => void;
  onLinkTask: (taskId: string) => void;
  onUnlinkTask: (taskId: string) => void;
  onCreateTask: () => void;
  onAddSource: (input: {
    title: string;
    authors?: string;
    url?: string;
    year?: string;
    doi?: string;
    notes?: string;
  }) => Promise<void>;
  onUpdateSource: (
    id: string,
    input: {
      title?: string;
      authors?: string;
      url?: string;
      year?: string;
      doi?: string;
      notes?: string;
    },
  ) => Promise<void>;
  onDeleteSource: (id: string) => Promise<void>;
  onAttachSourcePdf?: (sourceId: string, file: File) => Promise<void>;
  onClearSourcePdf?: (sourceId: string) => Promise<void>;
  onAddQuote: (input: {
    text: string;
    note?: string;
    sourceId?: string | null;
  }) => Promise<void>;
  onUpdateQuote: (
    id: string,
    input: {
      text?: string;
      note?: string | null;
      sourceId?: string | null;
    },
  ) => Promise<void>;
  onDeleteQuote: (id: string) => Promise<void>;
  onInsertQuote: (quote: DocQuoteItem) => void;
  onSaveVersion: (note?: string) => Promise<void>;
  onRestoreVersion: (versionId: string) => Promise<void>;
  onChecklistToTasks?: () => void;
  onCompareVersions?: (versionId?: string) => void;
  className?: string;
}) {
  const t = useTranslation();
  const language = useLanguage();
  const [tab, setTab] = React.useState<SideTab>("outline");

  const tabs: { id: SideTab; label: string }[] = [
    { id: "outline", label: t.docs.tabOutline },
    { id: "tasks", label: t.docs.tabTasks },
    { id: "sources", label: t.docs.tabSources },
    { id: "versions", label: t.docs.tabVersions },
  ];

  return (
    <aside
      className={cn(
        "rounded-2xl border bg-card shadow-sm flex flex-col min-h-0 overflow-hidden",
        className,
      )}
    >
      <div className="flex border-b overflow-x-auto">
        {tabs.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "flex-1 min-w-[4.5rem] px-2 py-2.5 text-xs font-medium whitespace-nowrap",
              tab === item.id
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {!doc ? (
          <p className="text-sm text-muted-foreground">{t.docs.pickOrCreate}</p>
        ) : tab === "outline" ? (
          <OutlineTab outline={outline} emptyLabel={t.docs.outlineEmpty} />
        ) : tab === "tasks" ? (
          <TasksTab
            doc={doc}
            taskQuery={taskQuery}
            taskHits={taskHits}
            language={language}
            labels={{
              hint: t.docs.linkedTasksHint,
              createTask: t.docs.createTask,
              search: t.docs.linkTaskSearch,
              empty: t.docs.noLinkedTasks,
              unlink: t.docs.unlinkTask,
              checklistToTasks: t.docs.checklistToTasks,
            }}
            onTaskQueryChange={onTaskQueryChange}
            onLinkTask={onLinkTask}
            onUnlinkTask={onUnlinkTask}
            onCreateTask={onCreateTask}
            onChecklistToTasks={onChecklistToTasks}
          />
        ) : tab === "sources" ? (
          <SourcesTab
            sources={doc.sources}
            quotes={doc.quotes}
            labels={{
              sources: t.docs.sources,
              addSource: t.docs.addSource,
              editSource: t.docs.editSource,
              saveSource: t.docs.saveSource,
              sourceTitle: t.docs.sourceTitle,
              sourceAuthors: t.docs.sourceAuthors,
              sourceUrl: t.docs.sourceUrl,
              sourceYear: t.docs.sourceYear,
              sourceNotes: t.docs.sourceNotes,
              noSources: t.docs.noSources,
              attachPdf: t.docs.attachPdf,
              replacePdf: t.docs.replacePdf,
              openPdf: t.docs.openPdf,
              removePdf: t.docs.removePdf,
              annotateInApp: t.docs.annotateInApp,
              pdfAnnotatorTitle: t.docs.pdfAnnotatorTitle,
              pdfAnnotatorLoading: t.docs.pdfAnnotatorLoading,
              pdfAnnotatorError: t.docs.pdfAnnotatorError,
              pdfAnnotatorPageOf: t.docs.pdfAnnotatorPageOf,
              pdfAnnotatorPrev: t.docs.pdfAnnotatorPrev,
              pdfAnnotatorNext: t.docs.pdfAnnotatorNext,
              pdfAnnotatorOpenExternal: t.docs.pdfAnnotatorOpenExternal,
              pdfAnnotatorHint: t.docs.pdfAnnotatorHint,
              pdfAnnotatorPageNote: t.docs.pdfAnnotatorPageNote,
              pdfAnnotatorClose: t.docs.pdfAnnotatorClose,
              pdfAnnotatorSaved: t.life.annotateQuoteSaved,
              quotes: t.docs.quotes,
              addQuote: t.docs.addQuote,
              saveQuote: t.docs.saveQuote,
              editQuote: t.docs.editQuote,
              quoteText: t.docs.quoteText,
              quoteNote: t.docs.quoteNote,
              quoteSource: t.docs.quoteSource,
              noQuotes: t.docs.noQuotes,
              insertQuote: t.docs.insertQuote,
              insertQuoteHint: t.docs.insertQuoteHint,
              cancel: t.common.cancel,
            }}
            onAddSource={onAddSource}
            onUpdateSource={onUpdateSource}
            onDeleteSource={onDeleteSource}
            onAttachSourcePdf={onAttachSourcePdf}
            onClearSourcePdf={onClearSourcePdf}
            onAddQuote={onAddQuote}
            onUpdateQuote={onUpdateQuote}
            onDeleteQuote={onDeleteQuote}
            onInsertQuote={onInsertQuote}
          />
        ) : (
          <VersionsTab
            versions={doc.versions}
            language={language}
            labels={{
              saveVersion: t.docs.saveVersion,
              restore: t.docs.restoreVersion,
              restoreConfirm: t.docs.restoreConfirm,
              empty: t.docs.noVersions,
              auto: t.docs.versionAuto,
              autoHint: t.docs.versionAutoHint,
              manual: t.docs.versionManual,
              beforeRestore: t.docs.versionBeforeRestore,
              words: t.docs.wordCount,
              compare: t.docs.compareVersions,
              compareWithCurrent: t.docs.compareWithCurrent,
              notePlaceholder: t.docs.versionNotePlaceholder,
            }}
            onSaveVersion={onSaveVersion}
            onRestoreVersion={onRestoreVersion}
            onCompareVersions={onCompareVersions}
          />
        )}
      </div>
    </aside>
  );
}

function OutlineTab({
  outline,
  emptyLabel,
}: {
  outline: OutlineHeading[];
  emptyLabel: string;
}) {
  if (outline.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-6">
        {emptyLabel}
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-0.5">
      {outline.map((h, index) => (
        <li key={`${h.id}-${index}`}>
          <button
            type="button"
            onClick={() => scrollDocEditorToHeading(index)}
            className={cn(
              "w-full text-start rounded-md px-2 py-1.5 text-sm hover:bg-accent truncate",
              h.level === 1 && "font-semibold",
              h.level === 2 && "ps-4 text-[13px]",
              h.level === 3 && "ps-7 text-xs text-muted-foreground",
            )}
          >
            {h.text}
          </button>
        </li>
      ))}
    </ul>
  );
}

function TasksTab({
  doc,
  taskQuery,
  taskHits,
  language,
  labels,
  onTaskQueryChange,
  onLinkTask,
  onUnlinkTask,
  onCreateTask,
  onChecklistToTasks,
}: {
  doc: DocDetail;
  taskQuery: string;
  taskHits: { id: string; title: string }[];
  language: "FA" | "EN";
  labels: {
    hint: string;
    createTask: string;
    search: string;
    empty: string;
    unlink: string;
    checklistToTasks: string;
  };
  onTaskQueryChange: (q: string) => void;
  onLinkTask: (taskId: string) => void;
  onUnlinkTask: (taskId: string) => void;
  onCreateTask: () => void;
  onChecklistToTasks?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">{labels.hint}</p>
      <Button size="sm" variant="subtle" onClick={onCreateTask}>
        <Icon name="plus" size={14} />
        {labels.createTask}
      </Button>
      {onChecklistToTasks && (
        <Button size="sm" variant="subtle" onClick={onChecklistToTasks}>
          {labels.checklistToTasks}
        </Button>
      )}
      <Input
        value={taskQuery}
        onChange={e => onTaskQueryChange(e.target.value)}
        placeholder={labels.search}
      />
      {taskHits.length > 0 && (
        <ul className="rounded-lg border divide-y overflow-hidden">
          {taskHits.map(hit => (
            <li key={hit.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-start text-sm hover:bg-accent truncate"
                onClick={() => onLinkTask(hit.id)}
              >
                {hit.title}
              </button>
            </li>
          ))}
        </ul>
      )}
      {doc.tasks.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          {labels.empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {doc.tasks.map(task => (
            <li
              key={task.id}
              className="rounded-lg border px-3 py-2 flex items-start gap-2"
            >
              <div className="min-w-0 flex-1">
                <a
                  href="/tasks"
                  className="text-sm font-medium hover:text-primary truncate block"
                  title={task.title}
                >
                  {task.title}
                </a>
                {task.dueDate && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {formatJalaliShort(new Date(task.dueDate), language)}
                  </p>
                )}
              </div>
              <IconButton
                icon="x"
                aria-label={labels.unlink}
                onClick={() => onUnlinkTask(task.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SourcesTab({
  sources,
  quotes,
  labels,
  onAddSource,
  onUpdateSource,
  onDeleteSource,
  onAttachSourcePdf,
  onClearSourcePdf,
  onAddQuote,
  onUpdateQuote,
  onDeleteQuote,
  onInsertQuote,
}: {
  sources: DocSourceItem[];
  quotes: DocQuoteItem[];
  labels: {
    sources: string;
    addSource: string;
    editSource: string;
    saveSource: string;
    sourceTitle: string;
    sourceAuthors: string;
    sourceUrl: string;
    sourceYear: string;
    sourceNotes: string;
    noSources: string;
    attachPdf: string;
    replacePdf: string;
    openPdf: string;
    removePdf: string;
    annotateInApp: string;
    pdfAnnotatorTitle: string;
    pdfAnnotatorLoading: string;
    pdfAnnotatorError: string;
    pdfAnnotatorPageOf: string;
    pdfAnnotatorPrev: string;
    pdfAnnotatorNext: string;
    pdfAnnotatorOpenExternal: string;
    pdfAnnotatorHint: string;
    pdfAnnotatorPageNote: string;
    pdfAnnotatorClose: string;
    pdfAnnotatorSaved: string;
    quotes: string;
    addQuote: string;
    saveQuote: string;
    editQuote: string;
    quoteText: string;
    quoteNote: string;
    quoteSource: string;
    noQuotes: string;
    insertQuote: string;
    insertQuoteHint: string;
    cancel: string;
  };
  onAddSource: (input: {
    title: string;
    authors?: string;
    url?: string;
    year?: string;
    doi?: string;
    notes?: string;
  }) => Promise<void>;
  onUpdateSource: (
    id: string,
    input: {
      title?: string;
      authors?: string;
      url?: string;
      year?: string;
      doi?: string;
      notes?: string;
    },
  ) => Promise<void>;
  onDeleteSource: (id: string) => Promise<void>;
  onAttachSourcePdf?: (sourceId: string, file: File) => Promise<void>;
  onClearSourcePdf?: (sourceId: string) => Promise<void>;
  onAddQuote: (input: {
    text: string;
    note?: string;
    sourceId?: string | null;
  }) => Promise<void>;
  onUpdateQuote: (
    id: string,
    input: {
      text?: string;
      note?: string | null;
      sourceId?: string | null;
    },
  ) => Promise<void>;
  onDeleteQuote: (id: string) => Promise<void>;
  onInsertQuote: (quote: DocQuoteItem) => void;
}) {
  const [showSourceForm, setShowSourceForm] = React.useState(false);
  const [editingSourceId, setEditingSourceId] = React.useState<string | null>(
    null,
  );
  const [showQuoteForm, setShowQuoteForm] = React.useState(false);
  const [editingQuoteId, setEditingQuoteId] = React.useState<string | null>(
    null,
  );
  const [sourceTitle, setSourceTitle] = React.useState("");
  const [authors, setAuthors] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [year, setYear] = React.useState("");
  const [doi, setDoi] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [quoteText, setQuoteText] = React.useState("");
  const [quoteNote, setQuoteNote] = React.useState("");
  const [quoteSourceId, setQuoteSourceId] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [annotating, setAnnotating] = React.useState<DocSourceItem | null>(
    null,
  );
  const fileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>(
    {},
  );

  function resetSourceForm() {
    setSourceTitle("");
    setAuthors("");
    setUrl("");
    setYear("");
    setDoi("");
    setNotes("");
    setEditingSourceId(null);
    setShowSourceForm(false);
  }

  function resetQuoteForm() {
    setQuoteText("");
    setQuoteNote("");
    setQuoteSourceId("");
    setEditingQuoteId(null);
    setShowQuoteForm(false);
  }

  function startEditSource(s: DocSourceItem) {
    setEditingSourceId(s.id);
    setSourceTitle(s.title);
    setAuthors(s.authors ?? "");
    setUrl(s.url ?? "");
    setYear(s.year ?? "");
    setDoi(s.doi ?? "");
    setNotes(s.notes ?? "");
    setShowSourceForm(true);
  }

  function startEditQuote(q: DocQuoteItem) {
    setEditingQuoteId(q.id);
    setQuoteText(q.text);
    setQuoteNote(q.note ?? "");
    setQuoteSourceId(q.sourceId ?? "");
    setShowQuoteForm(true);
  }

  async function submitSource() {
    if (!sourceTitle.trim()) return;
    setBusy(true);
    const payload = {
      title: sourceTitle.trim(),
      authors: authors.trim() || undefined,
      url: url.trim() || undefined,
      year: year.trim() || undefined,
      doi: doi.trim() || undefined,
      notes: notes.trim() || undefined,
    };
    if (editingSourceId) {
      await onUpdateSource(editingSourceId, payload);
    } else {
      await onAddSource(payload);
    }
    setBusy(false);
    resetSourceForm();
  }

  async function submitQuote() {
    if (!quoteText.trim()) return;
    setBusy(true);
    if (editingQuoteId) {
      await onUpdateQuote(editingQuoteId, {
        text: quoteText.trim(),
        note: quoteNote.trim() || null,
        sourceId: quoteSourceId || null,
      });
    } else {
      await onAddQuote({
        text: quoteText.trim(),
        note: quoteNote.trim() || undefined,
        sourceId: quoteSourceId || null,
      });
    }
    setBusy(false);
    resetQuoteForm();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{labels.sources}</h3>
        <Button
          size="sm"
          variant="subtle"
          onClick={() => {
            if (showSourceForm && !editingSourceId) resetSourceForm();
            else {
              setEditingSourceId(null);
              setShowSourceForm(v => !v);
            }
          }}
        >
          <Icon name="plus" size={14} />
          {labels.addSource}
        </Button>
      </div>

      {showSourceForm && (
        <div className="rounded-xl border p-3 flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            {editingSourceId ? labels.editSource : labels.addSource}
          </p>
          <Input
            value={sourceTitle}
            onChange={e => setSourceTitle(e.target.value)}
            placeholder={labels.sourceTitle}
          />
          <Input
            value={authors}
            onChange={e => setAuthors(e.target.value)}
            placeholder={labels.sourceAuthors}
          />
          <Input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder={labels.sourceUrl}
          />
          <Input
            value={year}
            onChange={e => setYear(e.target.value)}
            placeholder={labels.sourceYear}
          />
          <Input
            value={doi}
            onChange={e => setDoi(e.target.value)}
            placeholder="DOI"
          />
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={labels.sourceNotes}
            className="min-h-16 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={busy}
              onClick={() => void submitSource()}
            >
              {editingSourceId ? labels.saveSource : labels.addSource}
            </Button>
            <Button size="sm" variant="ghost" onClick={resetSourceForm}>
              {labels.cancel}
            </Button>
          </div>
        </div>
      )}

      {sources.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">
          {labels.noSources}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sources.map(s => (
            <li key={s.id} className="rounded-lg border px-3 py-2">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{s.title}</p>
                  {(s.authors || s.year || s.doi) && (
                    <p className="text-[11px] text-muted-foreground">
                      {[s.authors, s.year, s.doi].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {s.notes && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                      {s.notes}
                    </p>
                  )}
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-primary truncate block mt-0.5"
                    >
                      {s.url}
                    </a>
                  )}
                  {s.fileUrl && (
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <button
                        type="button"
                        className="text-[11px] text-primary hover:underline"
                        onClick={() => setAnnotating(s)}
                      >
                        {labels.annotateInApp}
                      </button>
                      <a
                        href={s.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-muted-foreground hover:underline truncate max-w-[10rem]"
                      >
                        {s.fileName || labels.openPdf}
                      </a>
                    </div>
                  )}
                </div>
                <IconButton
                  icon="pencil"
                  aria-label={labels.editSource}
                  onClick={() => startEditSource(s)}
                />
                {onAttachSourcePdf && (
                  <>
                    <input
                      ref={el => {
                        fileInputRefs.current[s.id] = el;
                      }}
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) void onAttachSourcePdf(s.id, file);
                      }}
                    />
                    <IconButton
                      icon="paperclip"
                      aria-label={
                        s.fileUrl ? labels.replacePdf : labels.attachPdf
                      }
                      title={s.fileUrl ? labels.replacePdf : labels.attachPdf}
                      onClick={() => fileInputRefs.current[s.id]?.click()}
                    />
                  </>
                )}
                {s.fileUrl && onClearSourcePdf && (
                  <IconButton
                    icon="x"
                    aria-label={labels.removePdf}
                    title={labels.removePdf}
                    onClick={() => void onClearSourcePdf(s.id)}
                  />
                )}
                <IconButton
                  icon="trash"
                  aria-label="delete"
                  onClick={() => void onDeleteSource(s.id)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t pt-3 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">{labels.quotes}</h3>
          <Button
            size="sm"
            variant="subtle"
            onClick={() => {
              if (showQuoteForm && !editingQuoteId) resetQuoteForm();
              else {
                setEditingQuoteId(null);
                setShowQuoteForm(v => !v);
              }
            }}
          >
            <Icon name="plus" size={14} />
            {labels.addQuote}
          </Button>
        </div>

        {showQuoteForm && (
          <div className="rounded-xl border p-3 flex flex-col gap-2">
            <textarea
              value={quoteText}
              onChange={e => setQuoteText(e.target.value)}
              placeholder={labels.quoteText}
              className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            <Input
              value={quoteNote}
              onChange={e => setQuoteNote(e.target.value)}
              placeholder={labels.quoteNote}
            />
            {sources.length > 0 && (
              <select
                value={quoteSourceId}
                onChange={e => setQuoteSourceId(e.target.value)}
                className="h-9 rounded-md border bg-background text-sm"
              >
                <option value="">{labels.quoteSource}</option>
                {sources.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            )}
            <div className="flex gap-2">
              <Button size="sm" disabled={busy} onClick={() => void submitQuote()}>
                {editingQuoteId ? labels.saveQuote : labels.addQuote}
              </Button>
              <Button size="sm" variant="ghost" onClick={resetQuoteForm}>
                {labels.cancel}
              </Button>
            </div>
          </div>
        )}

        {quotes.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            {labels.noQuotes}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {quotes.map(q => (
              <li key={q.id} className="rounded-lg border px-3 py-2">
                <div className="flex items-start gap-2">
                  <blockquote className="min-w-0 flex-1 text-sm leading-6 border-s-2 border-primary/40 ps-2">
                    {q.text}
                    {(q.sourceTitle || q.note) && (
                      <footer className="mt-1 text-[11px] text-muted-foreground">
                        {[q.sourceTitle, q.note].filter(Boolean).join(" — ")}
                      </footer>
                    )}
                  </blockquote>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="subtle"
                      title={labels.insertQuoteHint}
                      onClick={() => onInsertQuote(q)}
                    >
                      {labels.insertQuote}
                    </Button>
                    <IconButton
                      icon="pencil"
                      aria-label={labels.editQuote}
                      onClick={() => startEditQuote(q)}
                    />
                    <IconButton
                      icon="trash"
                      aria-label="delete"
                      onClick={() => void onDeleteQuote(q.id)}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {annotating?.fileUrl && (
        <PdfAnnotatorDialog
          open
          fileUrl={annotating.fileUrl}
          sourceTitle={annotating.title}
          labels={{
            title: labels.pdfAnnotatorTitle,
            loading: labels.pdfAnnotatorLoading,
            loadError: labels.pdfAnnotatorError,
            pageOf: labels.pdfAnnotatorPageOf,
            prevPage: labels.pdfAnnotatorPrev,
            nextPage: labels.pdfAnnotatorNext,
            openExternal: labels.pdfAnnotatorOpenExternal,
            selectionHint: labels.pdfAnnotatorHint,
            saveQuote: labels.saveQuote,
            quoteNote: labels.quoteNote,
            pageNote: labels.pdfAnnotatorPageNote,
            cancel: labels.cancel,
            saved: labels.pdfAnnotatorSaved,
            close: labels.pdfAnnotatorClose,
          }}
          onClose={() => setAnnotating(null)}
          onSaveQuote={async ({ text, note }) => {
            await onAddQuote({
              text,
              note,
              sourceId: annotating.id,
            });
          }}
        />
      )}
    </div>
  );
}

function VersionsTab({
  versions,
  language,
  labels,
  onSaveVersion,
  onRestoreVersion,
  onCompareVersions,
}: {
  versions: DocVersionItem[];
  language: "FA" | "EN";
  labels: {
    saveVersion: string;
    restore: string;
    restoreConfirm: string;
    empty: string;
    auto: string;
    autoHint: string;
    manual: string;
    beforeRestore: string;
    words: string;
    compare: string;
    compareWithCurrent: string;
    notePlaceholder: string;
  };
  onSaveVersion: (note?: string) => Promise<void>;
  onRestoreVersion: (versionId: string) => Promise<void>;
  onCompareVersions?: (versionId?: string) => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [note, setNote] = React.useState("");

  function noteLabel(versionNote: string | null) {
    if (versionNote === "auto") return labels.auto;
    if (versionNote === "before-restore") return labels.beforeRestore;
    if (versionNote === "manual" || !versionNote) return labels.manual;
    return versionNote;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] text-muted-foreground leading-5">
        {labels.autoHint}
      </p>
      <Input
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder={labels.notePlaceholder}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await onSaveVersion(note.trim() || undefined);
            setNote("");
            setBusy(false);
          }}
        >
          {labels.saveVersion}
        </Button>
        {onCompareVersions && versions.length > 0 && (
          <Button
            size="sm"
            variant="subtle"
            onClick={() => onCompareVersions()}
          >
            {labels.compare}
          </Button>
        )}
      </div>
      {versions.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">
          {labels.empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {versions.map(v => (
            <li key={v.id} className="rounded-lg border px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{v.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {formatJalaliShort(new Date(v.createdAt), language)} ·{" "}
                  {noteLabel(v.note)} · {formatNumber(v.wordCount, language)}{" "}
                  {labels.words}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {onCompareVersions && (
                  <Button
                    size="sm"
                    variant="subtle"
                    disabled={busy}
                    onClick={() => onCompareVersions(v.id)}
                  >
                    {labels.compareWithCurrent}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="subtle"
                  disabled={busy}
                  onClick={async () => {
                    if (!window.confirm(labels.restoreConfirm)) return;
                    setBusy(true);
                    await onRestoreVersion(v.id);
                    setBusy(false);
                  }}
                >
                  {labels.restore}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
