"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Menu } from "@/components/ui-kit/overlays/menu";
import {
  addPhdSourceAction,
  annotateSourceQuoteAction,
  createReadingCardForSourceAction,
  createSourceNoteFromSourceAction,
  insertCitationIntoDocAction,
  linkSourceToTaskAction,
  lookupDoiAction,
  searchPhdTasksForLinkAction,
} from "@/features/research/actions";
import {
  attachDocSourcePdf,
  clearDocSourcePdf,
  updateDocSource,
} from "@/features/docs/actions";
import { formatApaLike, sourcesToBibTeX } from "@/features/research/cite";
import type { ResearchProjectItem, ResearchSourceItem } from "@/features/research/types";
import type { DocListItem } from "@/features/docs/types";
import type { SourceReadingStatus } from "@/types/db";
import { cn } from "@/lib/utils";
import { projectIdForCreate } from "@/features/research/active-project";
import { PdfAnnotatorDialog } from "@/components/docs/pdf-annotator-dialog";

const READING: SourceReadingStatus[] = ["TO_READ", "READING", "DONE"];

export function ResearchLibraryPanel({
  initialSources,
  projectId,
  citeDocs = [],
  projects = [],
}: {
  initialSources: ResearchSourceItem[];
  projectId?: string | null;
  citeDocs?: DocListItem[];
  projects?: ResearchProjectItem[];
}) {
  const t = useTranslation();
  const language = useLanguage();
  const router = useRouter();
  const [sources, setSources] = React.useState(initialSources);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    SourceReadingStatus | "ALL"
  >("ALL");
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const pending = pendingId !== null;
  const [doiInput, setDoiInput] = React.useState("");
  const [citeFor, setCiteFor] = React.useState<string | null>(null);
  const [citeDocId, setCiteDocId] = React.useState("");
  const [quoteFor, setQuoteFor] = React.useState<string | null>(null);
  const [quoteText, setQuoteText] = React.useState("");
  const [quoteNote, setQuoteNote] = React.useState("");
  const [quoteDocId, setQuoteDocId] = React.useState("");
  const [annotating, setAnnotating] = React.useState<ResearchSourceItem | null>(
    null,
  );
  const [annotatorDraftId, setAnnotatorDraftId] = React.useState("");
  const [pathPick, setPathPick] = React.useState<string>("");
  const [linkFor, setLinkFor] = React.useState<string | null>(null);
  const [linkQuery, setLinkQuery] = React.useState("");
  const [linkHits, setLinkHits] = React.useState<
    { id: string; title: string }[]
  >([]);
  const fileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>(
    {},
  );
  const [form, setForm] = React.useState({
    title: "",
    authors: "",
    year: "",
    url: "",
    doi: "",
    notes: "",
  });
  const [flash, setFlash] = React.useState<string | null>(null);

  const needsPathPick = projectId === undefined;

  React.useEffect(() => {
    setSources(initialSources);
  }, [initialSources]);

  React.useEffect(() => {
    if (citeDocs[0] && !citeDocId) setCiteDocId(citeDocs[0].id);
    if (citeDocs[0] && !quoteDocId) setQuoteDocId(citeDocs[0].id);
    if (citeDocs[0] && !annotatorDraftId) setAnnotatorDraftId(citeDocs[0].id);
    try {
      const pref = sessionStorage.getItem("research-cite-doc");
      if (pref && citeDocs.some(d => d.id === pref)) {
        setCiteDocId(pref);
        setAnnotatorDraftId(pref);
        setQuoteDocId(pref);
        sessionStorage.removeItem("research-cite-doc");
        // Open cite UI on the first visible source when arriving from Writing.
        if (initialSources[0]) setCiteFor(initialSources[0].id);
      }
    } catch {
      /* ignore */
    }
  }, [citeDocs, citeDocId, quoteDocId, annotatorDraftId, initialSources]);

  React.useEffect(() => {
    if (!linkFor || linkQuery.trim().length < 1) {
      setLinkHits([]);
      return;
    }
    let cancelled = false;
    const handle = window.setTimeout(() => {
      void searchPhdTasksForLinkAction(linkQuery).then(rows => {
        if (!cancelled) setLinkHits(rows);
      });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [linkFor, linkQuery]);

  const filtered = sources.filter(s => {
    if (statusFilter !== "ALL" && s.readingStatus !== statusFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      s.title.toLowerCase().includes(q) ||
      (s.authors ?? "").toLowerCase().includes(q) ||
      (s.doi ?? "").toLowerCase().includes(q) ||
      (s.notes ?? "").toLowerCase().includes(q)
    );
  });

  function readingLabel(status: SourceReadingStatus) {
    if (status === "TO_READ") return t.life.readingToRead;
    if (status === "READING") return t.life.readingReading;
    return t.life.readingDone;
  }

  function resolveProjectId(): string | null | undefined {
    if (projectId !== undefined) return projectId;
    if (pathPick === "inbox") return null;
    if (pathPick) return pathPick;
    return projectIdForCreate();
  }

  async function onAdd() {
    if (!form.title.trim()) return;
    const pid = resolveProjectId();
    if (pid === undefined) {
      window.alert(t.life.pickPathRequired);
      return;
    }
    setPendingId("add");
    const result = await addPhdSourceAction({
      title: form.title,
      authors: form.authors || undefined,
      year: form.year || undefined,
      url: form.url || undefined,
      doi: form.doi || undefined,
      notes: form.notes || undefined,
      projectId: pid,
      createReadingCard: true,
    });
    setPendingId(null);
    if (result.success) {
      setForm({ title: "", authors: "", year: "", url: "", doi: "", notes: "" });
      setFlash(t.life.sourceAdded);
      router.refresh();
      setTimeout(() => setFlash(null), 1500);
    } else if (result.error) {
      window.alert(result.error);
    }
  }

  async function onLookupDoi() {
    if (!doiInput.trim()) return;
    setPendingId("doi");
    const result = await lookupDoiAction(doiInput);
    setPendingId(null);
    if (!result.success || !result.data) {
      window.alert(result.error ?? t.life.doiFailed);
      return;
    }
    const d = result.data as {
      title?: string;
      authors?: string | null;
      year?: string | null;
      url?: string | null;
      doi?: string | null;
      notes?: string | null;
    };
    setForm({
      title: d.title ?? "",
      authors: d.authors ?? "",
      year: d.year ?? "",
      url: d.url ?? "",
      doi: d.doi ?? doiInput,
      notes: d.notes ?? "",
    });
    setFlash(t.life.doiFilled);
    setTimeout(() => setFlash(null), 1500);
  }

  async function setReading(id: string, readingStatus: SourceReadingStatus) {
    await updateDocSource(id, { readingStatus });
    setSources(prev =>
      prev.map(s => (s.id === id ? { ...s, readingStatus } : s)),
    );
    router.refresh();
  }

  async function openNote(id: string) {
    setPendingId(id);
    const result = await createSourceNoteFromSourceAction(id);
    setPendingId(null);
    if (result.success && result.data?.id) {
      router.push(`/docs?id=${String(result.data.id)}`);
    } else if (result.error) {
      window.alert(result.error);
    }
  }

  async function createReadingCard(id: string) {
    setPendingId(id);
    const result = await createReadingCardForSourceAction(id);
    setPendingId(null);
    if (result.success) {
      setFlash(
        result.data?.created === true
          ? t.life.readingCardCreated
          : t.life.readingCardExists,
      );
      router.refresh();
      setTimeout(() => setFlash(null), 1500);
    } else if (result.error) {
      window.alert(result.error);
    }
  }

  async function linkToCard(sourceId: string, taskId: string) {
    setPendingId(sourceId);
    const result = await linkSourceToTaskAction({ sourceId, taskId });
    setPendingId(null);
    if (result.success) {
      setLinkFor(null);
      setLinkQuery("");
      setFlash(t.life.sourceLinked);
      router.refresh();
      setTimeout(() => setFlash(null), 1500);
    } else if (result.error) {
      window.alert(result.error);
    }
  }

  function exportBib() {
    const bib = sourcesToBibTeX(filtered);
    const blob = new Blob([bib], { type: "application/x-bibtex;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "research-sources.bib";
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyCitation(s: ResearchSourceItem) {
    const text = formatApaLike(s);
    void navigator.clipboard.writeText(text);
    setFlash(t.life.citationCopied);
    setTimeout(() => setFlash(null), 1200);
  }

  async function insertCitation(sourceId: string) {
    const targetId = citeDocId || citeDocs[0]?.id;
    if (!targetId) {
      window.alert(t.life.pickCiteDoc);
      return;
    }
    setPendingId(sourceId);
    const result = await insertCitationIntoDocAction({
      sourceId,
      docId: targetId,
    });
    setPendingId(null);
    setCiteFor(null);
    if (result.success && result.data?.id) {
      setFlash(t.life.citationInserted);
      router.push(`/docs?id=${String(result.data.id)}`);
    } else if (result.error) {
      window.alert(result.error);
    }
  }

  async function onAttachPdf(sourceId: string, file: File) {
    setPendingId(sourceId);
    const fd = new FormData();
    fd.set("file", file);
    const result = await attachDocSourcePdf(sourceId, fd);
    setPendingId(null);
    if (result.success) {
      const fileUrl = String(result.data?.fileUrl ?? "");
      const fileName = String(result.data?.fileName ?? file.name);
      setSources(prev =>
        prev.map(s =>
          s.id === sourceId ? { ...s, fileUrl, fileName } : s,
        ),
      );
      setFlash(t.life.pdfAttached);
      router.refresh();
      setTimeout(() => setFlash(null), 1500);
    } else if (result.error) {
      window.alert(result.error);
    }
  }

  async function onClearPdf(sourceId: string) {
    setPendingId(sourceId);
    const result = await clearDocSourcePdf(sourceId);
    setPendingId(null);
    if (result.success) {
      setSources(prev =>
        prev.map(s =>
          s.id === sourceId ? { ...s, fileUrl: null, fileName: null } : s,
        ),
      );
      setFlash(t.life.pdfRemoved);
      router.refresh();
      setTimeout(() => setFlash(null), 1500);
    } else if (result.error) {
      window.alert(result.error);
    }
  }

  async function onSaveQuote(sourceId: string, intoDoc: boolean) {
    if (!quoteText.trim()) return;
    setPendingId(sourceId);
    const result = await annotateSourceQuoteAction({
      sourceId,
      text: quoteText,
      note: quoteNote || undefined,
      insertIntoDocId: intoDoc && quoteDocId ? quoteDocId : undefined,
    });
    setPendingId(null);
    if (result.success) {
      setQuoteFor(null);
      setQuoteText("");
      setQuoteNote("");
      setSources(prev =>
        prev.map(s =>
          s.id === sourceId ? { ...s, quoteCount: s.quoteCount + 1 } : s,
        ),
      );
      setFlash(
        intoDoc ? t.life.annotateQuoteInserted : t.life.annotateQuoteSaved,
      );
      if (intoDoc && result.data?.docId) {
        router.push(`/docs?id=${String(result.data.docId)}`);
        return;
      }
      router.refresh();
      setTimeout(() => setFlash(null), 1500);
    } else if (result.error) {
      window.alert(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-semibold">{t.life.researchLibrary}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t.life.researchLibraryHint}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="subtle" onClick={exportBib}>
              {t.life.exportBibtex}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.life.librarySearch}
            className="max-w-xs"
          />
          <select
            className="h-9 rounded-lg border bg-background px-2 text-sm"
            value={statusFilter}
            onChange={e =>
              setStatusFilter(e.target.value as SourceReadingStatus | "ALL")
            }
          >
            <option value="ALL">{t.life.readingAll}</option>
            {READING.map(s => (
              <option key={s} value={s}>
                {readingLabel(s)}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-lg border p-3 mb-4 space-y-2">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[12rem]">
              <label className="text-[11px] text-muted-foreground">
                {t.life.doiLookup}
              </label>
              <Input
                value={doiInput}
                onChange={e => setDoiInput(e.target.value)}
                placeholder="10.xxxx/..."
              />
            </div>
            <Button
              size="sm"
              variant="subtle"
              disabled={pending}
              onClick={() => void onLookupDoi()}
            >
              {t.life.fetchDoi}
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {needsPathPick ? (
              <div className="sm:col-span-2">
                <label className="text-[11px] text-muted-foreground">
                  {t.life.pickPathRequired}
                </label>
                <select
                  className="mt-1 h-9 w-full rounded-lg border bg-background px-2 text-sm"
                  value={pathPick}
                  onChange={e => setPathPick(e.target.value)}
                >
                  <option value="">{t.life.pickPathRequired}</option>
                  <option value="inbox">{t.life.pathInbox}</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <Input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder={t.docs.sourceTitle}
            />
            <Input
              value={form.authors}
              onChange={e => setForm(f => ({ ...f, authors: e.target.value }))}
              placeholder={t.docs.sourceAuthors}
            />
            <Input
              value={form.year}
              onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
              placeholder={t.docs.sourceYear}
            />
            <Input
              value={form.doi}
              onChange={e => setForm(f => ({ ...f, doi: e.target.value }))}
              placeholder="DOI"
            />
            <Input
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder={t.docs.sourceUrl}
              className="sm:col-span-2"
            />
            <Input
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder={t.docs.sourceNotes}
              className="sm:col-span-2"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={pending || !form.title.trim()}
              onClick={() => void onAdd()}
            >
              {t.life.addSource}
            </Button>
            {flash && (
              <span className="text-xs text-muted-foreground">{flash}</span>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">
            {t.life.libraryEmpty}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {filtered.map(s => {
              const rowBusy = pendingId === s.id;
              return (
              <li
                key={s.id}
                className="rounded-lg border px-3 py-2.5 flex flex-col gap-2"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{s.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {[s.authors, s.year, s.doi].filter(Boolean).join(" · ")}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-1 gap-y-0.5">
                      <Link
                        href={`/docs?id=${s.docId}`}
                        className="hover:underline"
                      >
                        {s.docTitle}
                      </Link>
                      <span>·</span>
                      <span>
                        {s.quoteCount} {t.life.quoteCount}
                      </span>
                      {s.hasSyncLink && s.linkedTaskTitle ? (
                        <>
                          <span>·</span>
                          <span className="text-emerald-700 dark:text-emerald-400">
                            {t.life.linkedToCard}: {s.linkedTaskTitle}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>·</span>
                          <span className="text-amber-700 dark:text-amber-400">
                            {t.life.syncInactive}
                          </span>
                        </>
                      )}
                      {s.isBinderHost ? (
                        <>
                          <span>·</span>
                          <span>{t.life.binderHostHint}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {READING.map(st => (
                      <button
                        key={st}
                        type="button"
                        disabled={rowBusy}
                        onClick={() => void setReading(s.id, st)}
                        className={cn(
                          "rounded border px-1.5 py-0.5 text-[10px]",
                          s.readingStatus === st
                            ? "bg-primary text-primary-foreground border-primary"
                            : "hover:bg-accent",
                        )}
                      >
                        {readingLabel(st)}
                      </button>
                    ))}
                  </div>
                </div>
                {s.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {s.notes}
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={rowBusy}
                    onClick={() => void openNote(s.id)}
                  >
                    {t.life.openSourceNote}
                  </Button>
                  {!s.hasSyncLink ? (
                    <Button
                      size="sm"
                      variant="subtle"
                      disabled={rowBusy}
                      onClick={() => void createReadingCard(s.id)}
                    >
                      {t.life.createReadingCard}
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={rowBusy}
                    onClick={() => {
                      setLinkFor(linkFor === s.id ? null : s.id);
                      setLinkQuery("");
                      setCiteFor(null);
                      setQuoteFor(null);
                    }}
                  >
                    {t.life.linkSourceToCard}
                  </Button>
                  <Button
                    size="sm"
                    variant="subtle"
                    disabled={rowBusy || citeDocs.length === 0}
                    onClick={() =>
                      setCiteFor(citeFor === s.id ? null : s.id)
                    }
                  >
                    {t.life.insertCitation}
                  </Button>
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
                      if (file) void onAttachPdf(s.id, file);
                    }}
                  />
                  <Menu
                    align="end"
                    trigger={
                      <Button size="sm" variant="ghost" disabled={rowBusy}>
                        ⋯
                      </Button>
                    }
                    items={[
                      {
                        label: t.life.copyCitation,
                        onClick: () => copyCitation(s),
                      },
                      {
                        label: s.fileUrl ? t.life.replacePdf : t.life.attachPdf,
                        disabled: rowBusy,
                        onClick: () => fileInputRefs.current[s.id]?.click(),
                      },
                      ...(s.fileUrl
                        ? [
                            {
                              label: t.life.annotateInApp,
                              disabled: rowBusy,
                              onClick: () => setAnnotating(s),
                            },
                            {
                              label: t.life.openPdf,
                              onClick: () =>
                                window.open(s.fileUrl!, "_blank", "noreferrer"),
                            },
                            {
                              label: t.life.removePdf,
                              disabled: rowBusy,
                              onClick: () => void onClearPdf(s.id),
                            },
                          ]
                        : []),
                      {
                        label: t.life.annotateQuote,
                        disabled: rowBusy,
                        onClick: () => {
                          setQuoteFor(quoteFor === s.id ? null : s.id);
                          setQuoteText("");
                          setQuoteNote("");
                        },
                      },
                      ...(s.url
                        ? [
                            {
                              label: language === "FA" ? "لینک" : "URL",
                              onClick: () =>
                                window.open(s.url!, "_blank", "noreferrer"),
                            },
                          ]
                        : []),
                      ...(s.hasSyncLink
                        ? [
                            {
                              label: t.life.createReadingCard,
                              disabled: rowBusy,
                              onClick: () => void createReadingCard(s.id),
                            },
                          ]
                        : []),
                    ]}
                  />
                </div>
                {quoteFor === s.id && (
                  <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-2">
                    <textarea
                      value={quoteText}
                      onChange={e => setQuoteText(e.target.value)}
                      placeholder={t.life.annotateQuoteHint}
                      className="min-h-[4.5rem] w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                    />
                    <Input
                      value={quoteNote}
                      onChange={e => setQuoteNote(e.target.value)}
                      placeholder={t.docs.quoteNote}
                    />
                    {citeDocs.length > 0 ? (
                      <div className="min-w-0">
                        <label className="text-[10px] text-muted-foreground">
                          {t.life.insertQuoteIntoDoc}
                        </label>
                        <select
                          className="mt-0.5 h-8 w-full rounded-md border bg-background px-2 text-xs"
                          value={quoteDocId}
                          onChange={e => setQuoteDocId(e.target.value)}
                        >
                          {citeDocs.map(d => (
                            <option key={d.id} value={d.id}>
                              {d.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={rowBusy || !quoteText.trim()}
                        onClick={() => void onSaveQuote(s.id, false)}
                      >
                        {t.life.saveQuote}
                      </Button>
                      <Button
                        size="sm"
                        variant="subtle"
                        disabled={
                          rowBusy || !quoteText.trim() || !quoteDocId
                        }
                        onClick={() => void onSaveQuote(s.id, true)}
                      >
                        {t.life.insertQuoteIntoDoc}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setQuoteFor(null)}
                      >
                        {t.common.cancel}
                      </Button>
                    </div>
                    {citeDocs.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground">
                        {t.life.noDraftForInsert}
                      </p>
                    ) : null}
                  </div>
                )}
                {citeFor === s.id && (
                  <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-2">
                    {citeDocs.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground">
                        {t.life.noDraftForInsert}
                      </p>
                    ) : (
                      <div className="flex flex-wrap items-end gap-2">
                        <div className="min-w-[10rem] flex-1">
                          <label className="text-[10px] text-muted-foreground">
                            {t.life.pickCiteDoc}
                          </label>
                          <select
                            className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                            value={citeDocId}
                            onChange={e => setCiteDocId(e.target.value)}
                          >
                            {citeDocs.map(d => (
                              <option key={d.id} value={d.id}>
                                {d.title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button
                          size="sm"
                          disabled={rowBusy || !citeDocId}
                          onClick={() => void insertCitation(s.id)}
                        >
                          {t.life.insertCitation}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                {linkFor === s.id && (
                  <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-2">
                    <p className="text-[10px] text-muted-foreground">
                      {t.life.linkReplacesCard}
                    </p>
                    <Input
                      value={linkQuery}
                      onChange={e => setLinkQuery(e.target.value)}
                      placeholder={t.life.searchPhdCard}
                    />
                    {linkHits.length > 0 ? (
                      <ul className="flex flex-col gap-1">
                        {linkHits.map(hit => (
                          <li key={hit.id}>
                            <button
                              type="button"
                              disabled={rowBusy}
                              className="w-full rounded-md border px-2 py-1.5 text-start text-xs hover:bg-accent"
                              onClick={() => void linkToCard(s.id, hit.id)}
                            >
                              {hit.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : linkQuery.trim() ? (
                      <p className="text-[11px] text-muted-foreground">
                        {t.life.noCardMatch}
                      </p>
                    ) : null}
                  </div>
                )}
              </li>
              );
            })}
          </ul>
        )}
      </section>

      {annotating?.fileUrl && (
        <PdfAnnotatorDialog
          open
          fileUrl={annotating.fileUrl}
          sourceTitle={annotating.title}
          draftDocs={citeDocs.map(d => ({ id: d.id, title: d.title }))}
          insertIntoDocId={annotatorDraftId || undefined}
          onInsertIntoDocIdChange={setAnnotatorDraftId}
          labels={{
            title: t.life.pdfAnnotatorTitle,
            loading: t.life.pdfAnnotatorLoading,
            loadError: t.life.pdfAnnotatorError,
            pageOf: t.life.pdfAnnotatorPageOf,
            prevPage: t.life.pdfAnnotatorPrev,
            nextPage: t.life.pdfAnnotatorNext,
            openExternal: t.life.pdfAnnotatorOpenExternal,
            selectionHint: t.life.pdfAnnotatorHint,
            saveQuote: t.life.saveQuote,
            quoteNote: t.docs.quoteNote,
            pageNote: t.life.pdfAnnotatorPageNote,
            cancel: t.common.cancel,
            saved: t.life.annotateQuoteSaved,
            close: t.life.pdfAnnotatorClose,
            insertIntoDraft: t.life.insertIntoDraft,
            pickDraftDoc: t.life.pickDraftDoc,
            noDraftHint: t.life.noDraftForInsert,
          }}
          onClose={() => setAnnotating(null)}
          onSaveQuote={async ({ text, note, insertIntoDocId }) => {
            const result = await annotateSourceQuoteAction({
              sourceId: annotating.id,
              text,
              note,
              insertIntoDocId,
            });
            if (!result.success) {
              window.alert(result.error ?? "Error");
              throw new Error(result.error ?? "save failed");
            }
            setSources(prev =>
              prev.map(s =>
                s.id === annotating.id
                  ? { ...s, quoteCount: s.quoteCount + 1 }
                  : s,
              ),
            );
            if (insertIntoDocId) {
              setFlash(t.life.annotateQuoteInserted);
              setAnnotating(null);
              router.push(`/docs?id=${insertIntoDocId}`);
              return;
            }
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
