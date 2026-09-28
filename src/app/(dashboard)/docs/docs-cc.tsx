"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { DocSidePanel } from "@/components/docs/doc-side-panel";
import { Button } from "@/components/ui-kit/forms/button";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import { Input } from "@/components/ui-kit/forms/input";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { cn, formatNumber } from "@/lib/utils";
import { formatJalaliShort, LIFE_AREAS } from "@/lib/life";
import {
  addDocQuote,
  addDocSource,
  attachDocSourcePdf,
  clearDocSourcePdf,
  createDoc,
  createDocFromTemplate,
  createDocFolder,
  createDocTag,
  createTaskFromDoc,
  createTasksFromDocChecklist,
  deleteDoc,
  deleteDocFolder,
  deleteDocQuote,
  deleteDocSource,
  deleteDocTag,
  getDocAction,
  linkDocTask,
  listDocFoldersAction,
  listDocsAction,
  listDocTagsAction,
  mergeDocTags,
  openDailyNoteAction,
  purgeDocForever,
  restoreDocFromTrash,
  restoreDocVersion,
  saveDocVersion,
  searchLinkableTasks,
  searchMentionsAction,
  toggleDocTag,
  unlinkDocTask,
  updateDoc,
  updateDocFolder,
  updateDocSource,
  updateDocQuote,
  updateDocTag,
} from "@/features/docs/actions";
import { listPhdResearchProjectsAction } from "@/features/research/actions";
import { projectIdForCreate } from "@/features/research/active-project";
import {
  docInternalUrl,
  downloadMarkdown,
  downloadWordDoc,
  printDocAsPdf,
} from "@/features/docs/export";
import { DOC_TEMPLATES, type DocTemplateKey } from "@/features/docs/templates";
import type { OutlineHeading } from "@/features/docs/utils";
import {
  buildFolderTree,
  folderOptionLabel,
} from "@/features/docs/folder-tree";
import {
  DOC_STATUSES,
  type DocDetail,
  type DocFolderItem,
  type DocListItem,
  type DocQuoteItem,
  type DocTagItem,
} from "@/features/docs/types";
import type { DocStatus, LifeArea } from "@/types/db";
import { VersionCompareModal } from "@/components/docs/version-compare-modal";
import {
  DocTaxonomyDrawer,
  type TaxonomyDrawerMode,
} from "@/components/docs/doc-taxonomy-drawer";
import { DocTaxonomyManageDrawer } from "@/components/docs/doc-taxonomy-manage-drawer";
import { DocWordGoalDrawer } from "@/components/docs/doc-word-goal-drawer";
import { ChecklistToTasksDrawer } from "@/components/docs/checklist-to-tasks-drawer";
import { Menu } from "@/components/ui-kit/overlays/menu";
import { countWords } from "@/features/docs/utils";
import { extractTaskCandidatesFromHtml } from "@/features/docs/checklist";

const DocEditor = dynamic(
  () =>
    import("@/components/docs/doc-editor").then(m => ({ default: m.DocEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[16rem] animate-pulse rounded-lg bg-muted/40" />
    ),
  },
);

const AREA_DOT: Record<LifeArea, string> = {
  PHD: "bg-[var(--status-review)]",
  WORK: "bg-[var(--status-in-progress)]",
  LIFE: "bg-[var(--status-todo)]",
  LANG: "bg-emerald-600",
};

type AreaFilter = LifeArea | "ALL";

function areaLabel(
  area: LifeArea,
  t: { phd: string; work: string; lifeArea: string; language?: string },
) {
  if (area === "PHD") return t.phd;
  if (area === "WORK") return t.work;
  if (area === "LANG") return t.language ?? "زبان";
  return t.lifeArea;
}

function statusLabel(
  status: DocStatus,
  t: {
    statusIdea: string;
    statusDrafting: string;
    statusReview: string;
    statusReady: string;
  },
) {
  if (status === "IDEA") return t.statusIdea;
  if (status === "REVIEW") return t.statusReview;
  if (status === "READY") return t.statusReady;
  return t.statusDrafting;
}

export function DocsCC({
  initialDocs,
  initialDoc,
  initialShowArchived = false,
}: {
  initialDocs: DocListItem[];
  initialDoc: DocDetail | null;
  initialShowArchived?: boolean;
}) {
  const t = useTranslation();
  const language = useLanguage();
  const router = useRouter();

  const [docs, setDocs] = React.useState(initialDocs);
  const [selectedId, setSelectedId] = React.useState<string | null>(
    initialDoc?.id ?? initialDocs[0]?.id ?? null,
  );
  const [doc, setDoc] = React.useState<DocDetail | null>(initialDoc);
  const [areaFilter, setAreaFilter] = React.useState<AreaFilter>("ALL");
  const [search, setSearch] = React.useState("");
  const [showArchived, setShowArchived] = React.useState(initialShowArchived);
  const [showTrash, setShowTrash] = React.useState(false);
  const [showTemplates, setShowTemplates] = React.useState(false);
  const [compareOpen, setCompareOpen] = React.useState(false);
  const [compareVersionId, setCompareVersionId] = React.useState<string | null>(
    null,
  );
  const [taxonomyDrawer, setTaxonomyDrawer] = React.useState<{
    open: boolean;
    mode: TaxonomyDrawerMode;
    parentId?: string | null;
    editFolder?: DocFolderItem | null;
    editTag?: DocTagItem | null;
  }>({ open: false, mode: "folder" });
  const [manageTaxonomyOpen, setManageTaxonomyOpen] = React.useState(false);
  const [wordGoalOpen, setWordGoalOpen] = React.useState(false);
  const [checklistPreviewOpen, setChecklistPreviewOpen] = React.useState(false);
  const [checklistCandidates, setChecklistCandidates] = React.useState<string[]>(
    [],
  );
  const [folders, setFolders] = React.useState<DocFolderItem[]>([]);
  const [tags, setTags] = React.useState<DocTagItem[]>([]);
  const [phdProjects, setPhdProjects] = React.useState<
    { id: string; name: string; description: string | null }[]
  >([]);
  const [folderFilter, setFolderFilter] = React.useState<string | "ALL" | "NONE">(
    "ALL",
  );
  const [tagFilter, setTagFilter] = React.useState<string | "ALL">("ALL");
  const [saveState, setSaveState] = React.useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [taskQuery, setTaskQuery] = React.useState("");
  const [taskHits, setTaskHits] = React.useState<{ id: string; title: string }[]>(
    [],
  );
  const [outline, setOutline] = React.useState<OutlineHeading[]>([]);
  const [pending, setPending] = React.useState(false);
  const [focusMode, setFocusMode] = React.useState(false);
  const [copyFlash, setCopyFlash] = React.useState(false);

  const titleRef = React.useRef(doc?.title ?? "");
  const contentRef = React.useRef(doc?.content ?? "");
  const lastSavedTitleRef = React.useRef(doc?.title ?? "");
  const lastSavedContentRef = React.useRef(doc?.content ?? "");
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedIdRef = React.useRef(selectedId);
  selectedIdRef.current = selectedId;

  async function refreshList(
    archived = showArchived,
    trash = showTrash,
  ) {
    const next = await listDocsAction({
      area: areaFilter,
      search,
      archived,
      trash,
      folderId:
        trash || folderFilter === "ALL"
          ? undefined
          : folderFilter === "NONE"
            ? "NONE"
            : folderFilter,
      tagId: trash || tagFilter === "ALL" ? undefined : tagFilter,
    });
    setDocs(next);
    return next;
  }

  async function refreshTaxonomy() {
    const [nextFolders, nextTags, nextPhd] = await Promise.all([
      listDocFoldersAction(),
      listDocTagsAction(),
      listPhdResearchProjectsAction(),
    ]);
    setFolders(nextFolders);
    setTags(nextTags);
    setPhdProjects(nextPhd);
  }

  React.useEffect(() => {
    void refreshTaxonomy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function reloadDoc(id: string) {
    const detail = await getDocAction(id);
    setDoc(detail);
    if (detail) {
      titleRef.current = detail.title;
      contentRef.current = detail.content;
      lastSavedTitleRef.current = detail.title;
      lastSavedContentRef.current = detail.content;
    }
    return detail;
  }

  React.useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(async () => {
      const next = await listDocsAction({
        area: areaFilter,
        search,
        archived: showArchived,
        trash: showTrash,
        folderId:
          showTrash || folderFilter === "ALL"
            ? undefined
            : folderFilter === "NONE"
              ? "NONE"
              : folderFilter,
        tagId: showTrash || tagFilter === "ALL" ? undefined : tagFilter,
      });
      if (cancelled) return;
      setDocs(next);

      const currentId = selectedIdRef.current;
      const stillVisible = currentId
        ? next.some(item => item.id === currentId)
        : false;

      if (stillVisible) return;

      if (next[0]) {
        setSelectedId(next[0].id);
        const detail = await getDocAction(next[0].id);
        if (cancelled) return;
        setDoc(detail);
        if (detail) {
          titleRef.current = detail.title;
          contentRef.current = detail.content;
          lastSavedTitleRef.current = detail.title;
          lastSavedContentRef.current = detail.content;
          router.replace(`/docs?id=${detail.id}`, { scroll: false });
        }
      } else {
        setDoc(null);
        setSelectedId(null);
        router.replace("/docs", { scroll: false });
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaFilter, search, showArchived, showTrash, folderFilter, tagFilter]);

  async function selectDoc(id: string) {
    setSelectedId(id);
    const detail = await reloadDoc(id);
    setSaveState("idle");
    setOutline([]);
    if (detail) {
      if (detail.archived !== showArchived) {
        setShowArchived(detail.archived);
      }
      router.replace(`/docs?id=${id}`, { scroll: false });
    }
  }

  function scheduleSave(patch: { title?: string; content?: string }) {
    if (!selectedId) return;
    const nextTitle =
      patch.title !== undefined ? patch.title : titleRef.current;
    const nextContent =
      patch.content !== undefined ? patch.content : contentRef.current;

    // TipTap / title echoes must not trigger save when nothing changed
    if (
      nextTitle === lastSavedTitleRef.current &&
      nextContent === lastSavedContentRef.current
    ) {
      titleRef.current = nextTitle;
      contentRef.current = nextContent;
      return;
    }

    titleRef.current = nextTitle;
    contentRef.current = nextContent;
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const id = selectedIdRef.current;
      if (!id) return;
      // Drop if a later edit reverted to last saved
      if (
        titleRef.current === lastSavedTitleRef.current &&
        contentRef.current === lastSavedContentRef.current
      ) {
        setSaveState("idle");
        return;
      }
      const result = await updateDoc(id, {
        title: titleRef.current,
        content: contentRef.current,
      });
      if (result.success) {
        lastSavedTitleRef.current = titleRef.current;
        lastSavedContentRef.current = contentRef.current;
        setSaveState("saved");
        setDocs(prev =>
          prev.map(item =>
            item.id === id
              ? {
                  ...item,
                  title: titleRef.current,
                  preview: contentRef.current
                    .replace(/<[^>]+>/g, " ")
                    .replace(/\s+/g, " ")
                    .trim()
                    .slice(0, 90),
                  updatedAt: new Date(),
                }
              : item,
          ),
        );
        setTimeout(() => setSaveState("idle"), 1200);
      } else {
        setSaveState("idle");
      }
    }, 700);
  }

  /** Cancel pending debounce and optionally flush latest editor state to DB. */
  async function flushPendingSave(opts?: { write?: boolean }) {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (opts?.write === false || !selectedId) return;
    if (
      titleRef.current === lastSavedTitleRef.current &&
      contentRef.current === lastSavedContentRef.current
    ) {
      return;
    }
    setSaveState("saving");
    const result = await updateDoc(selectedId, {
      title: titleRef.current,
      content: contentRef.current,
    });
    if (result.success) {
      lastSavedTitleRef.current = titleRef.current;
      lastSavedContentRef.current = contentRef.current;
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 800);
    } else {
      setSaveState("idle");
    }
  }

  async function onCreate(area: LifeArea = "LIFE") {
    setPending(true);
    setShowArchived(false);
    setShowTrash(false);
    setFolderFilter("ALL");
    setTagFilter("ALL");
    try {
      const pid = area === "PHD" ? projectIdForCreate() : undefined;
      const result = await createDoc({
        area,
        title: t.docs.untitled,
        content: `<p>${t.docs.emptyBody}</p>`,
        ...(pid !== undefined ? { projectId: pid } : {}),
      });
      if (!result.success || !result.data?.id) return;
      const next = await listDocsAction({
        area: areaFilter === "ALL" ? "ALL" : area,
        search,
        archived: false,
        trash: false,
        folderId: undefined,
        tagId: undefined,
      });
      if (areaFilter !== "ALL" && areaFilter !== area) {
        setAreaFilter("ALL");
      }
      setDocs(next);
      await selectDoc(result.data.id);
    } finally {
      setPending(false);
    }
  }

  async function onCreateFromTemplate(key: DocTemplateKey) {
    setPending(true);
    setShowTemplates(false);
    setShowArchived(false);
    setShowTrash(false);
    setFolderFilter("ALL");
    setTagFilter("ALL");
    try {
      const { getDocTemplate } = await import("@/features/docs/templates");
      const tpl = getDocTemplate(key);
      const pid = tpl.area === "PHD" ? projectIdForCreate() : undefined;
      const result = await createDoc({
        templateKey: key,
        area: tpl.area,
        ...(pid !== undefined ? { projectId: pid } : {}),
      });
      if (!result.success || !result.data?.id) return;
      const next = await listDocsAction({
        area: "ALL",
        search,
        archived: false,
        trash: false,
        folderId: undefined,
        tagId: undefined,
      });
      setAreaFilter("ALL");
      setDocs(next);
      await selectDoc(result.data.id);
    } finally {
      setPending(false);
    }
  }

  async function onTogglePin() {
    if (!doc) return;
    const pinned = !doc.pinned;
    setDoc({ ...doc, pinned });
    await updateDoc(doc.id, { pinned });
    await refreshList();
  }

  async function onArchive() {
    if (!doc) return;
    const id = doc.id;
    const nextArchived = !doc.archived;

    // Cancel pending autosave so it doesn't race with archive flip
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    await updateDoc(id, {
      archived: nextArchived,
      title: titleRef.current,
      content: contentRef.current,
    });

    setShowArchived(nextArchived);
    const next = await refreshList(nextArchived);
    const detail = await getDocAction(id);
    if (detail && next.some(item => item.id === id)) {
      setDoc(detail);
      setSelectedId(id);
      titleRef.current = detail.title;
      contentRef.current = detail.content;
      lastSavedTitleRef.current = detail.title;
      lastSavedContentRef.current = detail.content;
      router.replace(`/docs?id=${id}`, { scroll: false });
    } else if (next[0]) {
      await selectDoc(next[0].id);
    } else {
      setDoc(null);
      setSelectedId(null);
      router.replace("/docs", { scroll: false });
    }
  }

  async function onDelete() {
    if (!doc) return;
    if (doc.deletedAt) {
      if (!window.confirm(t.docs.purgeConfirm)) return;
      await purgeDocForever(doc.id);
    } else {
      if (!window.confirm(t.docs.deleteToTrashConfirm)) return;
      await deleteDoc(doc.id);
    }
    setDoc(null);
    setSelectedId(null);
    await refreshList();
    router.replace("/docs", { scroll: false });
  }

  async function onRestoreTrash() {
    if (!doc?.deletedAt) return;
    await restoreDocFromTrash(doc.id);
    setShowTrash(false);
    await refreshList(false, false);
    await selectDoc(doc.id);
  }

  async function onAreaChange(area: LifeArea) {
    if (!doc) return;
    setDoc({ ...doc, area });
    setDocs(prev =>
      prev.map(item => (item.id === doc.id ? { ...item, area } : item)),
    );
    await updateDoc(doc.id, { area });
  }

  async function onStatusChange(status: DocStatus) {
    if (!doc) return;
    setDoc({ ...doc, status });
    setDocs(prev =>
      prev.map(item => (item.id === doc.id ? { ...item, status } : item)),
    );
    await updateDoc(doc.id, { status });
  }

  async function onWordGoalSave(wordGoal: number | null) {
    if (!doc) return false;
    setDoc({ ...doc, wordGoal });
    const result = await updateDoc(doc.id, { wordGoal });
    return result.success;
  }

  React.useEffect(() => {
    if (!taskQuery.trim()) {
      setTaskHits([]);
      return;
    }
    const handle = setTimeout(async () => {
      setTaskHits(await searchLinkableTasks(taskQuery));
    }, 250);
    return () => clearTimeout(handle);
  }, [taskQuery]);

  async function onLinkTask(taskId: string) {
    if (!doc) return;
    await linkDocTask(doc.id, taskId);
    await reloadDoc(doc.id);
    setTaskQuery("");
    setTaskHits([]);
    await refreshList();
  }

  async function onUnlinkTask(taskId: string) {
    if (!doc) return;
    await unlinkDocTask(doc.id, taskId);
    await reloadDoc(doc.id);
    await refreshList();
  }

  async function onCreateTaskFromTitle() {
    if (!doc) return;
    const title = window.prompt(t.docs.newTaskPrompt, doc.title);
    if (!title?.trim()) return;
    await createTaskFromDoc({
      docId: doc.id,
      title: title.trim(),
      area: doc.area,
    });
    await reloadDoc(doc.id);
    await refreshList();
  }

  async function onCreateTaskFromText(text: string) {
    if (!doc) return;
    const title = text.replace(/\s+/g, " ").trim().slice(0, 160);
    if (!title) return;
    await createTaskFromDoc({
      docId: doc.id,
      title,
      area: doc.area,
    });
    await reloadDoc(doc.id);
    await refreshList();
  }

  async function onCreateQuoteFromText(text: string) {
    if (!doc) return;
    const quote = text.replace(/\s+/g, " ").trim();
    if (!quote) return;
    await addDocQuote({ docId: doc.id, text: quote });
    await reloadDoc(doc.id);
  }

  function openChecklistPreview() {
    if (!doc) return;
    const html = contentRef.current || doc.content;
    const candidates = extractTaskCandidatesFromHtml(html).slice(0, 20);
    setChecklistCandidates(candidates);
    setChecklistPreviewOpen(true);
  }

  async function confirmChecklistTasks(titles: string[]) {
    if (!doc) return false;
    await flushPendingSave({ write: true });
    const result = await createTasksFromDocChecklist(doc.id, titles);
    if (result.success) {
      await reloadDoc(doc.id);
      await refreshList();
      return true;
    }
    if (result.error) window.alert(result.error);
    return false;
  }

  async function onCopyLink() {
    if (!doc) return;
    try {
      await navigator.clipboard.writeText(docInternalUrl(doc.id));
      setCopyFlash(true);
      setTimeout(() => setCopyFlash(false), 1400);
    } catch {
      window.prompt(t.docs.copyLink, docInternalUrl(doc.id));
    }
  }

  const folderTreeFlat = React.useMemo(
    () => buildFolderTree(folders).flat,
    [folders],
  );

  const saveLabel =
    saveState === "saving"
      ? t.docs.saving
      : saveState === "saved"
        ? t.docs.saved
        : copyFlash
          ? t.docs.linkCopied
          : "";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 h-[calc(100dvh-3rem)] min-h-[640px]",
        focusMode && "fixed inset-0 z-40 bg-background p-4 h-dvh min-h-0",
      )}
    >
      {!focusMode && (
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        <h1 className="text-xl font-semibold">{t.docs.title}</h1>
        <Button size="sm" onClick={() => void onCreate()} disabled={pending}>
          <Icon name="plus" size={14} />
          {t.docs.newDoc}
        </Button>
        <Button
          size="sm"
          variant="subtle"
          onClick={() => setShowTemplates(true)}
          disabled={pending}
        >
          {t.docs.fromTemplate}
        </Button>
        <div className="flex flex-wrap items-center gap-1.5 ms-auto text-xs">
          <button
            type="button"
            onClick={() => setAreaFilter("ALL")}
            className={cn(
              "rounded-md border px-2 py-1",
              areaFilter === "ALL"
                ? "border-primary bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {t.docs.filterAll}
          </button>
          {LIFE_AREAS.map(area => (
            <button
              key={area}
              type="button"
              onClick={() => setAreaFilter(area)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2 py-1",
                areaFilter === area
                  ? "border-foreground/20 bg-card"
                  : "opacity-45 hover:opacity-80",
              )}
            >
              <span className={cn("size-2.5 rounded-full", AREA_DOT[area])} />
              {areaLabel(area, t.life)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setShowTrash(false);
              setShowArchived(v => !v);
            }}
            className={cn(
              "rounded-md border px-2 py-1",
              showArchived && !showTrash
                ? "border-primary bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {t.docs.archived}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowArchived(false);
              setShowTrash(v => !v);
            }}
            className={cn(
              "rounded-md border px-2 py-1",
              showTrash
                ? "border-primary bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {t.docs.trash}
          </button>
        </div>
      </div>
      )}

      <div
        className={cn(
          "grid gap-4 flex-1 min-h-0",
          focusMode
            ? "grid-cols-1"
            : "xl:grid-cols-[280px_minmax(0,1fr)_300px]",
        )}
      >
        {!focusMode && (
        <aside className="rounded-2xl border bg-card shadow-sm flex flex-col min-h-0 overflow-hidden">
          <div className="p-3 border-b flex flex-col gap-2">
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.docs.search}
            />
            {!showTrash && (
              <>
                <select
                  className="h-8 rounded-md border bg-background text-xs"
                  value={folderFilter}
                  onChange={e =>
                    setFolderFilter(
                      e.target.value as string | "ALL" | "NONE",
                    )
                  }
                  aria-label={t.docs.folders}
                >
                  <option value="ALL">{t.docs.folders}: {t.docs.filterAll}</option>
                  <option value="NONE">{t.docs.noFolder}</option>
                  {folderTreeFlat.map(f => (
                    <option
                      key={f.id}
                      value={f.id}
                      title={f.description ?? undefined}
                    >
                      {folderOptionLabel(f)}
                    </option>
                  ))}
                </select>
                <select
                  className="h-8 rounded-md border bg-background text-xs"
                  value={tagFilter}
                  onChange={e =>
                    setTagFilter(e.target.value as string | "ALL")
                  }
                  aria-label={t.docs.tags}
                >
                  <option value="ALL">{t.docs.tags}: {t.docs.filterAll}</option>
                  {tags.map(tag => (
                    <option key={tag.id} value={tag.id} title={tag.description ?? undefined}>
                      {tag.name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon="settings"
                    className="justify-center gap-2"
                    onClick={() => setManageTaxonomyOpen(true)}
                  >
                    {t.docs.manageTaxonomy}
                  </Button>
                </div>
              </>
            )}
            {showTrash && (
              <p className="text-[11px] text-muted-foreground">{t.docs.trashHint}</p>
            )}
          </div>
          <div className="flex-1 overflow-auto p-2">
            {docs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 px-3">
                {showArchived ? t.docs.archivedEmpty : t.docs.emptyList}
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {docs.map(item => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => void selectDoc(item.id)}
                      className={cn(
                        "w-full rounded-xl px-3 py-2.5 text-start transition-colors",
                        selectedId === item.id
                          ? "bg-primary/10 ring-1 ring-primary/30"
                          : "hover:bg-accent",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "size-2 rounded-full shrink-0",
                            AREA_DOT[item.area],
                          )}
                        />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {item.title}
                        </span>
                        {item.pinned && (
                          <Icon
                            name="flag"
                            size={12}
                            className="text-primary shrink-0"
                          />
                        )}
                      </div>
                      {item.preview && (
                        <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2 ps-4">
                          {item.preview}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-2 ps-4 text-[10px] text-muted-foreground">
                        <span>
                          {formatJalaliShort(new Date(item.updatedAt), language)}
                        </span>
                        {item.wordCount > 0 && (
                          <span>
                            {formatNumber(item.wordCount, language)}{" "}
                            {t.docs.wordCount}
                          </span>
                        )}
                        {item.taskCount > 0 && (
                          <span>
                            {formatNumber(item.taskCount, language)}{" "}
                            {t.docs.linkedTasks}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
        )}

        <section className="rounded-2xl border bg-card shadow-sm flex flex-col min-h-0 overflow-hidden">
          {!doc ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
              <p className="text-muted-foreground text-sm">{t.docs.pickOrCreate}</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button onClick={() => void onCreate()} disabled={pending}>
                  {t.docs.newDoc}
                </Button>
                <Button
                  variant="subtle"
                  onClick={() => setShowTemplates(true)}
                  disabled={pending}
                >
                  {t.docs.fromTemplate}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
                <input
                  value={doc.title}
                  onChange={e => {
                    const title = e.target.value;
                    setDoc({ ...doc, title });
                    scheduleSave({ title });
                  }}
                  className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none"
                  placeholder={t.docs.untitled}
                />
                <span className="text-xs text-muted-foreground min-w-16 text-end">
                  {saveLabel}
                </span>
                <IconButton
                  icon="eye"
                  aria-label={
                    focusMode ? t.docs.exitFocus : t.docs.focusMode
                  }
                  title={focusMode ? t.docs.exitFocus : t.docs.focusMode}
                  active={focusMode}
                  onClick={() => setFocusMode(v => !v)}
                />
                <IconButton
                  icon="copy"
                  aria-label={t.docs.copyLink}
                  title={t.docs.copyLink}
                  onClick={() => void onCopyLink()}
                />
                <Menu
                  align="end"
                  trigger={
                    <IconButton
                      icon="download"
                      aria-label={t.docs.exportDoc}
                      title={t.docs.exportDocHint}
                    />
                  }
                  items={[
                    {
                      label: t.docs.exportMarkdown,
                      icon: "download",
                      onClick: () =>
                        downloadMarkdown(
                          doc.title,
                          contentRef.current || doc.content,
                        ),
                    },
                    {
                      label: t.docs.exportPdf,
                      icon: "file-text",
                      onClick: () =>
                        printDocAsPdf(
                          doc.title,
                          contentRef.current || doc.content,
                        ),
                    },
                    {
                      label: t.docs.exportWord,
                      icon: "file-text",
                      onClick: () => {
                        void downloadWordDoc(
                          doc.title,
                          contentRef.current || doc.content,
                        );
                      },
                    },
                  ]}
                />
                {!focusMode && !doc.deletedAt && (
                  <>
                    <IconButton
                      icon="flag"
                      aria-label={t.docs.pin}
                      onClick={() => void onTogglePin()}
                    />
                    <IconButton
                      icon="archive"
                      aria-label={
                        doc.archived ? t.docs.unarchive : t.docs.archive
                      }
                      title={
                        doc.archived
                          ? t.docs.restoreFromArchive
                          : t.docs.archive
                      }
                      active={doc.archived}
                      onClick={() => void onArchive()}
                    />
                    <IconButton
                      icon="trash"
                      aria-label={t.docs.delete}
                      onClick={() => void onDelete()}
                    />
                  </>
                )}
                {!focusMode && doc.deletedAt && (
                  <>
                    <Button size="sm" variant="subtle" onClick={() => void onRestoreTrash()}>
                      {t.docs.restoreTrash}
                    </Button>
                    <IconButton
                      icon="trash"
                      aria-label={t.docs.purgeForever}
                      onClick={() => void onDelete()}
                    />
                  </>
                )}
              </div>
              {!focusMode && (
              <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b bg-muted/20">
                {LIFE_AREAS.map(area => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => void onAreaChange(area)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
                      doc.area === area
                        ? "border-foreground/25 bg-card font-medium"
                        : "opacity-50 hover:opacity-90",
                    )}
                  >
                    <span className={cn("size-2 rounded-full", AREA_DOT[area])} />
                    {areaLabel(area, t.life)}
                  </button>
                ))}
                <span className="mx-1 h-4 w-px bg-border" />
                <select
                  value={doc.status}
                  onChange={e =>
                    void onStatusChange(e.target.value as DocStatus)
                  }
                  className="h-7 rounded-full border bg-card text-xs"
                  aria-label={t.docs.status}
                >
                  {DOC_STATUSES.map(status => (
                    <option key={status} value={status}>
                      {statusLabel(status, t.docs)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setWordGoalOpen(true)}
                  className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:bg-card"
                >
                  {t.docs.wordGoal}
                  {doc.wordGoal
                    ? `: ${formatNumber(doc.wordGoal, language)}`
                    : ""}
                </button>
                <select
                  className="h-7 rounded-full border bg-card text-xs"
                  value={doc.folderId ?? ""}
                  onChange={e => {
                    const folderId = e.target.value || null;
                    setDoc({
                      ...doc,
                      folderId,
                      folderName:
                        folders.find(f => f.id === folderId)?.name ?? null,
                    });
                    void updateDoc(doc.id, { folderId });
                    void refreshList();
                  }}
                  aria-label={t.docs.assignFolder}
                >
                  <option value="">{t.docs.noFolder}</option>
                  {folderTreeFlat.map(f => (
                    <option key={f.id} value={f.id}>
                      {folderOptionLabel(f)}
                    </option>
                  ))}
                </select>
                {(doc.area === "PHD" || phdProjects.length > 0) && (
                  <select
                    className="h-7 rounded-full border bg-card text-xs max-w-[10rem]"
                    value={doc.projectId ?? ""}
                    onChange={e => {
                      const projectId = e.target.value || null;
                      setDoc({
                        ...doc,
                        projectId,
                        projectName:
                          phdProjects.find(p => p.id === projectId)?.name ??
                          null,
                        area: projectId ? "PHD" : doc.area,
                      });
                      void updateDoc(doc.id, {
                        projectId,
                        ...(projectId ? { area: "PHD" } : {}),
                      });
                      void refreshList();
                    }}
                    aria-label={t.docs.assignResearchProject}
                  >
                    <option value="">{t.docs.noResearchProject}</option>
                    {phdProjects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
                <div className="flex flex-wrap gap-1">
                  {tags.map(tag => {
                    const active = doc.tags.some(x => x.id === tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        title={tag.description ?? undefined}
                        onClick={async () => {
                          await toggleDocTag(doc.id, tag.id);
                          await reloadDoc(doc.id);
                          await refreshList();
                        }}
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[11px]",
                          active
                            ? "border-foreground/30 bg-card font-medium"
                            : "opacity-50 hover:opacity-90",
                        )}
                        style={
                          active
                            ? { borderColor: tag.color, color: tag.color }
                            : undefined
                        }
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              )}
              <div className="flex-1 overflow-auto p-4">
                <DocEditor
                  key={doc.id}
                  content={doc.content}
                  placeholder={t.docs.editorPlaceholder}
                  dir={language === "FA" ? "rtl" : "ltr"}
                  language={language}
                  wordLabel={t.docs.wordCount}
                  wordGoal={doc.wordGoal}
                  focusMode={focusMode}
                  selectionToTaskLabel={t.docs.selectionToTask}
                  selectionToQuoteLabel={t.docs.selectionToQuote}
                  toolbarLabels={{
                    bold: t.docs.toolbarBold,
                    italic: t.docs.toolbarItalic,
                    strike: t.docs.toolbarStrike,
                    h1: t.docs.toolbarH1,
                    h2: t.docs.toolbarH2,
                    h3: t.docs.toolbarH3,
                    bulletList: t.docs.toolbarBulletList,
                    orderedList: t.docs.toolbarOrderedList,
                    taskList: t.docs.toolbarTaskList,
                    blockquote: t.docs.toolbarBlockquote,
                    codeBlock: t.docs.toolbarCodeBlock,
                    link: t.docs.toolbarLink,
                    table: t.docs.toolbarTable,
                    tableHint: t.docs.toolbarTableHint,
                    tableAddRow: t.docs.toolbarTableAddRow,
                    tableAddCol: t.docs.toolbarTableAddCol,
                    tableDelRow: t.docs.toolbarTableDelRow,
                    tableDelCol: t.docs.toolbarTableDelCol,
                    tableDelete: t.docs.toolbarTableDelete,
                    image: t.docs.toolbarImage,
                    footnote: t.docs.toolbarFootnote,
                    more: t.docs.toolbarMore,
                  }}
                  footnotePromptLabel={t.docs.footnotePrompt}
                  slashHint={t.docs.slashHint}
                  slashEmptyLabel={t.docs.slashEmpty}
                  editable={!doc.deletedAt}
                  onChange={html => scheduleSave({ content: html })}
                  onReady={html => {
                    contentRef.current = html;
                    lastSavedContentRef.current = html;
                  }}
                  onOutlineChange={setOutline}
                  onCreateTaskFromText={text => void onCreateTaskFromText(text)}
                  onCreateQuoteFromText={text =>
                    void onCreateQuoteFromText(text)
                  }
                  onSearchMentions={query => searchMentionsAction(query)}
                />
              </div>
            </>
          )}
        </section>

        {!focusMode && (
        <DocSidePanel
          doc={doc}
          outline={outline}
          taskQuery={taskQuery}
          taskHits={taskHits}
          onTaskQueryChange={setTaskQuery}
          onLinkTask={id => void onLinkTask(id)}
          onUnlinkTask={id => void onUnlinkTask(id)}
          onCreateTask={() => void onCreateTaskFromTitle()}
          onAddSource={async input => {
            if (!doc) return;
            await addDocSource({ docId: doc.id, ...input });
            await reloadDoc(doc.id);
          }}
          onUpdateSource={async (id, input) => {
            if (!doc) return;
            await updateDocSource(id, input);
            await reloadDoc(doc.id);
          }}
          onDeleteSource={async id => {
            if (!doc) return;
            await deleteDocSource(id);
            await reloadDoc(doc.id);
          }}
          onAttachSourcePdf={async (sourceId, file) => {
            if (!doc) return;
            const fd = new FormData();
            fd.set("file", file);
            const result = await attachDocSourcePdf(sourceId, fd);
            if (!result.success && result.error) {
              window.alert(result.error);
              return;
            }
            await reloadDoc(doc.id);
          }}
          onClearSourcePdf={async sourceId => {
            if (!doc) return;
            const result = await clearDocSourcePdf(sourceId);
            if (!result.success && result.error) {
              window.alert(result.error);
              return;
            }
            await reloadDoc(doc.id);
          }}
          onAddQuote={async input => {
            if (!doc) return;
            await addDocQuote({ docId: doc.id, ...input });
            await reloadDoc(doc.id);
          }}
          onUpdateQuote={async (id, input) => {
            if (!doc) return;
            await updateDocQuote(id, input);
            await reloadDoc(doc.id);
          }}
          onDeleteQuote={async id => {
            if (!doc) return;
            await deleteDocQuote(id);
            await reloadDoc(doc.id);
          }}
          onInsertQuote={(quote: DocQuoteItem) => {
            if (!doc) return;
            const escape = (s: string) =>
              s
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            const citeParts = [
              quote.sourceTitle,
              quote.note,
            ].filter(Boolean);
            const cite = citeParts.length
              ? `<p><em>— ${escape(citeParts.join(" · "))}</em></p>`
              : "";
            const chunk = `<blockquote><p>${escape(quote.text)}</p>${cite}</blockquote><p></p>`;
            const next = `${contentRef.current || doc.content}${chunk}`;
            contentRef.current = next;
            setDoc({ ...doc, content: next });
            scheduleSave({ content: next });
          }}
          onSaveVersion={async (note?: string) => {
            if (!doc) return;
            await flushPendingSave({ write: true });
            await saveDocVersion(doc.id, note);
            await reloadDoc(doc.id);
          }}
          onRestoreVersion={async versionId => {
            if (!doc) return;
            // Drop pending autosave so it cannot overwrite the restored content
            await flushPendingSave({ write: false });
            await restoreDocVersion(doc.id, versionId);
            const detail = await reloadDoc(doc.id);
            if (detail) {
              titleRef.current = detail.title;
              contentRef.current = detail.content;
            }
            await refreshList();
          }}
          onChecklistToTasks={() => openChecklistPreview()}
          onCompareVersions={versionId => {
            setCompareVersionId(versionId ?? null);
            setCompareOpen(true);
          }}
        />
        )}
      </div>

      {doc && (
        <VersionCompareModal
          open={compareOpen}
          docId={doc.id}
          currentTitle={doc.title}
          currentContent={contentRef.current || doc.content}
          versions={doc.versions}
          initialRightId={compareVersionId}
          onClose={() => {
            setCompareOpen(false);
            setCompareVersionId(null);
          }}
          onRestore={async versionId => {
            await flushPendingSave({ write: false });
            await restoreDocVersion(doc.id, versionId);
            const detail = await reloadDoc(doc.id);
            if (detail) {
              titleRef.current = detail.title;
              contentRef.current = detail.content;
            }
            await refreshList();
          }}
        />
      )}

      <DocTaxonomyDrawer
        open={taxonomyDrawer.open}
        mode={taxonomyDrawer.mode}
        folders={folders}
        editFolder={taxonomyDrawer.editFolder ?? null}
        editTag={taxonomyDrawer.editTag ?? null}
        initialParentId={taxonomyDrawer.parentId ?? null}
        onClose={() =>
          setTaxonomyDrawer(prev => ({
            ...prev,
            open: false,
            editFolder: null,
            editTag: null,
            parentId: null,
          }))
        }
        onSubmit={async input => {
          if (taxonomyDrawer.mode === "folder") {
            if (taxonomyDrawer.editFolder) {
              const result = await updateDocFolder(taxonomyDrawer.editFolder.id, {
                name: input.name,
                description: input.description,
                area: input.area,
                parentId: input.parentId,
              });
              if (!result.success) return false;
              await refreshTaxonomy();
              return true;
            }
            const result = await createDocFolder({
              name: input.name,
              description: input.description,
              area: input.area,
              parentId: input.parentId ?? taxonomyDrawer.parentId ?? null,
            });
            if (!result.success) return false;
            await refreshTaxonomy();
            if (result.data?.id) setFolderFilter(result.data.id);
            return true;
          }
          if (taxonomyDrawer.editTag) {
            const result = await updateDocTag(taxonomyDrawer.editTag.id, {
              name: input.name,
              description: input.description,
              color: input.color,
            });
            if (!result.success) return false;
            await refreshTaxonomy();
            return true;
          }
          const result = await createDocTag({
            name: input.name,
            description: input.description,
            color: input.color,
          });
          if (!result.success) return false;
          await refreshTaxonomy();
          if (result.data?.id) setTagFilter(result.data.id);
          return true;
        }}
      />

      <DocTaxonomyManageDrawer
        open={manageTaxonomyOpen}
        folders={folders}
        tags={tags}
        onClose={() => setManageTaxonomyOpen(false)}
        onCreateFolder={parentId => {
          setTaxonomyDrawer({
            open: true,
            mode: "folder",
            parentId: parentId ?? null,
            editFolder: null,
            editTag: null,
          });
        }}
        onEditFolder={folder => {
          setTaxonomyDrawer({
            open: true,
            mode: "folder",
            editFolder: folder,
            editTag: null,
          });
        }}
        onDeleteFolder={async id => {
          await deleteDocFolder(id);
          await refreshTaxonomy();
          if (folderFilter === id) setFolderFilter("ALL");
        }}
        onCreateTag={() => {
          setTaxonomyDrawer({
            open: true,
            mode: "tag",
            editFolder: null,
            editTag: null,
          });
        }}
        onEditTag={tag => {
          setTaxonomyDrawer({
            open: true,
            mode: "tag",
            editFolder: null,
            editTag: tag,
          });
        }}
        onDeleteTag={async id => {
          await deleteDocTag(id);
          await refreshTaxonomy();
          if (tagFilter === id) setTagFilter("ALL");
        }}
        onMergeTags={async (keepId, absorbId) => {
          await mergeDocTags(keepId, absorbId);
          await refreshTaxonomy();
          if (tagFilter === absorbId) setTagFilter(keepId);
        }}
      />

      <DocWordGoalDrawer
        open={wordGoalOpen}
        currentGoal={doc?.wordGoal ?? null}
        currentWords={countWords(
          doc?.contentText ||
            (contentRef.current || "").replace(/<[^>]+>/g, " "),
        )}
        language={language}
        onClose={() => setWordGoalOpen(false)}
        onSubmit={onWordGoalSave}
      />

      <ChecklistToTasksDrawer
        open={checklistPreviewOpen}
        candidates={checklistCandidates}
        language={language}
        onClose={() => setChecklistPreviewOpen(false)}
        onConfirm={confirmChecklistTasks}
      />

      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t.docs.close}
            onClick={() => setShowTemplates(false)}
          />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl border bg-card shadow-xl p-5 max-h-[85dvh] overflow-auto">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold">{t.docs.templates}</h2>
              <IconButton
                icon="x"
                aria-label={t.docs.close}
                onClick={() => setShowTemplates(false)}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {DOC_TEMPLATES.map(tpl => (
                <button
                  key={tpl.key}
                  type="button"
                  disabled={pending}
                  onClick={() => void onCreateFromTemplate(tpl.key)}
                  className="rounded-xl border p-4 text-start hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn("size-2 rounded-full", AREA_DOT[tpl.area])}
                    />
                    <span className="font-medium text-sm">
                      {language === "FA" ? tpl.titleFa : tpl.titleEn}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-5">
                    {language === "FA"
                      ? tpl.descriptionFa
                      : tpl.descriptionEn}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
