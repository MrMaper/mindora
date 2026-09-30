"use client";

import * as React from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import {
  Table,
  TableRow,
  TableCell,
  TableHeader,
} from "@tiptap/extension-table";
import { Footnote } from "@/features/docs/extensions/footnote";
import { Button } from "@/components/ui-kit/forms/button";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Menu } from "@/components/ui-kit/overlays/menu";
import { cn } from "@/lib/utils";
import { formatJalaliDate } from "@/lib/life";
import {
  countWords,
  parseOutlineFromHtml,
  type OutlineHeading,
} from "@/features/docs/utils";
import {
  filterSlashCommands,
  type SlashCommand,
  type SlashCommandId,
} from "@/features/docs/slash-commands";

interface DocEditorProps {
  content: string;
  placeholder?: string;
  editable?: boolean;
  dir?: "rtl" | "ltr";
  language?: "FA" | "EN";
  wordLabel?: string;
  wordGoal?: number | null;
  focusMode?: boolean;
  className?: string;
  selectionToTaskLabel?: string;
  selectionToQuoteLabel?: string;
  toolbarLabels?: Partial<DocToolbarLabels>;
  footnotePromptLabel?: string;
  slashHint?: string;
  slashEmptyLabel?: string;
  onChange?: (html: string, meta: { text: string; words: number }) => void;
  onOutlineChange?: (headings: OutlineHeading[]) => void;
  /** Called once after editor hydrates (normalized HTML) — not a user edit. */
  onReady?: (html: string) => void;
  onCreateTaskFromText?: (text: string) => void | Promise<void>;
  onCreateQuoteFromText?: (text: string) => void | Promise<void>;
  onSearchMentions?: (
    query: string,
  ) => Promise<{ id: string; label: string; kind: "doc" | "task"; href: string }[]>;
}

export type DocToolbarLabels = {
  bold: string;
  italic: string;
  strike: string;
  h1: string;
  h2: string;
  h3: string;
  bulletList: string;
  orderedList: string;
  taskList: string;
  blockquote: string;
  codeBlock: string;
  link: string;
  table: string;
  tableHint: string;
  tableAddRow: string;
  tableAddCol: string;
  tableDelRow: string;
  tableDelCol: string;
  tableDelete: string;
  image: string;
  footnote: string;
  more: string;
};

const DEFAULT_TOOLBAR_LABELS: DocToolbarLabels = {
  bold: "Bold",
  italic: "Italic",
  strike: "Strikethrough",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  bulletList: "Bullet list",
  orderedList: "Numbered list",
  taskList: "Checklist",
  blockquote: "Quote",
  codeBlock: "Code block",
  link: "Link",
  table: "Insert table",
  tableHint: "Pick size",
  tableAddRow: "Add row",
  tableAddCol: "Add column",
  tableDelRow: "Delete row",
  tableDelCol: "Delete column",
  tableDelete: "Delete table",
  image: "Insert image",
  footnote: "Insert footnote",
  more: "More",
};

type SlashState = {
  query: string;
  from: number;
  to: number;
  top: number;
  left: number;
  items: SlashCommand[];
  index: number;
};

export function DocEditor({
  content,
  placeholder = "شروع به نوشتن کنید…",
  editable = true,
  dir = "rtl",
  language = "FA",
  wordLabel = "words",
  wordGoal,
  focusMode = false,
  className,
  selectionToTaskLabel = "Convert to task",
  selectionToQuoteLabel = "Save quote",
  toolbarLabels,
  footnotePromptLabel = "Footnote text",
  slashHint = "/ commands",
  slashEmptyLabel = "No commands",
  onChange,
  onOutlineChange,
  onReady,
  onCreateTaskFromText,
  onCreateQuoteFromText,
  onSearchMentions,
}: DocEditorProps) {
  const tb = { ...DEFAULT_TOOLBAR_LABELS, ...toolbarLabels };
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const onOutlineRef = React.useRef(onOutlineChange);
  onOutlineRef.current = onOutlineChange;
  const onReadyRef = React.useRef(onReady);
  onReadyRef.current = onReady;
  const emitChangesRef = React.useRef(false);
  const onTaskRef = React.useRef(onCreateTaskFromText);
  onTaskRef.current = onCreateTaskFromText;
  const onQuoteRef = React.useRef(onCreateQuoteFromText);
  onQuoteRef.current = onCreateQuoteFromText;
  const onMentionsRef = React.useRef(onSearchMentions);
  onMentionsRef.current = onSearchMentions;
  const languageRef = React.useRef(language);
  languageRef.current = language;

  const wrapRef = React.useRef<HTMLDivElement>(null);
  const slashRef = React.useRef<SlashState | null>(null);
  const runSlashRef = React.useRef<
    (id: SlashCommandId, from: number, to: number) => void
  >(() => undefined);

  const [words, setWords] = React.useState(0);
  const [slash, setSlash] = React.useState<SlashState | null>(null);
  const [selectionMenu, setSelectionMenu] = React.useState<{
    top: number;
    left: number;
    text: string;
  } | null>(null);
  const [mention, setMention] = React.useState<{
    query: string;
    from: number;
    to: number;
    top: number;
    left: number;
    items: { id: string; label: string; kind: "doc" | "task"; href: string }[];
    index: number;
  } | null>(null);

  const setSlashBoth = React.useCallback((next: SlashState | null) => {
    slashRef.current = next;
    setSlash(next);
  }, []);

  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const pickImageRef = React.useRef<() => void>(() => undefined);
  const openTablePickerRef = React.useRef<() => void>(() => undefined);
  const tablePickerRef = React.useRef<HTMLDivElement>(null);
  const [tablePickerOpen, setTablePickerOpen] = React.useState(false);
  const [tableHover, setTableHover] = React.useState({ rows: 0, cols: 0 });
  const footnotePromptRef = React.useRef(footnotePromptLabel);
  footnotePromptRef.current = footnotePromptLabel;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline" },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: { class: "doc-editor-image" },
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Footnote,
    ],
    content,
    editable,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class: cn(
          "doc-editor min-h-[11rem] sm:min-h-[24rem] xl:min-h-[420px] focus:outline-none px-1 py-2 text-[15px] sm:text-sm leading-7",
          focusMode && "min-h-[60dvh] sm:min-h-[70dvh] text-base leading-8",
          dir === "rtl" && "text-right",
        ),
        dir,
      },
      handleKeyDown: (_view, event) => {
        const current = slashRef.current;
        if (!current) return false;
        if (event.key === "ArrowDown") {
          event.preventDefault();
          const index = Math.min(
            current.index + 1,
            Math.max(current.items.length - 1, 0),
          );
          setSlashBoth({ ...current, index });
          return true;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSlashBoth({ ...current, index: Math.max(current.index - 1, 0) });
          return true;
        }
        if (event.key === "Enter" || event.key === "Tab") {
          const item = current.items[current.index];
          if (item) {
            event.preventDefault();
            runSlashRef.current(item.id, current.from, current.to);
            return true;
          }
        }
        if (event.key === "Escape") {
          setSlashBoth(null);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed, transaction }) => {
      const html = ed.getHTML();
      const text = ed.getText();
      const w = countWords(text);
      setWords(w);
      onOutlineRef.current?.(parseOutlineFromHtml(html));
      if (emitChangesRef.current && transaction.docChanged) {
        onChangeRef.current?.(html, { text, words: w });
      }
      syncSlash(ed);
      void syncMention(ed);
    },
    onSelectionUpdate: ({ editor: ed }) => {
      syncSelectionMenu(ed);
    },
  });

  function syncSlash(ed: Editor) {
    const { from, empty } = ed.state.selection;
    if (!empty) {
      setSlashBoth(null);
      return;
    }
    const textBefore = ed.state.doc.textBetween(
      Math.max(0, from - 40),
      from,
      "\n",
      "\n",
    );
    const match = textBefore.match(/(?:^|\n|\s)\/([^\s/]*)$/);
    if (!match) {
      setSlashBoth(null);
      return;
    }
    const query = match[1] ?? "";
    const slashFrom = from - query.length - 1;
    const items = filterSlashCommands(query);
    const coords = ed.view.coordsAtPos(slashFrom);
    const wrap = wrapRef.current?.getBoundingClientRect();
    setSlashBoth({
      query,
      from: slashFrom,
      to: from,
      top: coords.bottom - (wrap?.top ?? 0) + 6,
      left: coords.left - (wrap?.left ?? 0),
      items,
      index: 0,
    });
  }

  async function syncMention(ed: Editor) {
    if (!onMentionsRef.current) {
      setMention(null);
      return;
    }
    const { from, empty } = ed.state.selection;
    if (!empty) {
      setMention(null);
      return;
    }
    const textBefore = ed.state.doc.textBetween(
      Math.max(0, from - 40),
      from,
      "\n",
      "\n",
    );
    const match = textBefore.match(/(?:^|\n|\s)@([^\s@]*)$/);
    if (!match) {
      setMention(null);
      return;
    }
    const query = match[1] ?? "";
    const mentionFrom = from - query.length - 1;
    const items = await onMentionsRef.current(query);
    const coords = ed.view.coordsAtPos(mentionFrom);
    const wrap = wrapRef.current?.getBoundingClientRect();
    setMention({
      query,
      from: mentionFrom,
      to: from,
      top: coords.bottom - (wrap?.top ?? 0) + 6,
      left: coords.left - (wrap?.left ?? 0),
      items,
      index: 0,
    });
  }

  function syncSelectionMenu(ed: Editor) {
    const { from, to, empty } = ed.state.selection;
    if (empty || (!onTaskRef.current && !onQuoteRef.current)) {
      setSelectionMenu(null);
      return;
    }
    const text = ed.state.doc.textBetween(from, to, " ").trim();
    if (!text || text.length < 2) {
      setSelectionMenu(null);
      return;
    }
    const start = ed.view.coordsAtPos(from);
    const end = ed.view.coordsAtPos(to);
    const wrap = wrapRef.current?.getBoundingClientRect();
    setSelectionMenu({
      top: Math.min(start.top, end.top) - (wrap?.top ?? 0) - 44,
      left: (start.left + end.left) / 2 - (wrap?.left ?? 0),
      text,
    });
  }

  React.useEffect(() => {
    if (!editor) return;
    runSlashRef.current = (id, from, to) => {
      editor.chain().focus().deleteRange({ from, to }).run();
      setSlashBoth(null);

      switch (id) {
        case "h1":
          editor.chain().focus().toggleHeading({ level: 1 }).run();
          break;
        case "h2":
          editor.chain().focus().toggleHeading({ level: 2 }).run();
          break;
        case "h3":
          editor.chain().focus().toggleHeading({ level: 3 }).run();
          break;
        case "bullet":
          editor.chain().focus().toggleBulletList().run();
          break;
        case "ordered":
          editor.chain().focus().toggleOrderedList().run();
          break;
        case "todo":
          editor.chain().focus().toggleTaskList().run();
          break;
        case "quote":
          editor.chain().focus().toggleBlockquote().run();
          break;
        case "code":
          editor.chain().focus().toggleCodeBlock().run();
          break;
        case "divider":
          editor.chain().focus().setHorizontalRule().run();
          break;
        case "date":
          editor
            .chain()
            .focus()
            .insertContent(formatJalaliDate(new Date(), languageRef.current))
            .run();
          break;
        case "task": {
          const line = editor.state.doc
            .textBetween(
              editor.state.selection.$from.start(),
              editor.state.selection.$from.end(),
              " ",
            )
            .trim();
          const title =
            line ||
            (languageRef.current === "FA"
              ? "کار جدید از سند"
              : "New task from doc");
          void onTaskRef.current?.(title);
          break;
        }
        case "table":
          openTablePickerRef.current();
          break;
        case "image":
          pickImageRef.current();
          break;
        case "footnote": {
          const text =
            window.prompt(footnotePromptRef.current) || "";
          editor.chain().focus().insertFootnote(text || undefined).run();
          break;
        }
      }
    };
  }, [editor, setSlashBoth]);

  React.useEffect(() => {
    pickImageRef.current = () => imageInputRef.current?.click();
    openTablePickerRef.current = () => {
      setTableHover({ rows: 0, cols: 0 });
      setTablePickerOpen(true);
    };
  }, []);

  React.useEffect(() => {
    if (!tablePickerOpen) return;
    function onDocClick(e: MouseEvent) {
      if (!tablePickerRef.current?.contains(e.target as Node)) {
        setTablePickerOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setTablePickerOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [tablePickerOpen]);

  function insertTableAt(rows: number, cols: number) {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: true })
      .run();
    setTablePickerOpen(false);
  }

  function onImageFile(file: File | null) {
    if (!file || !editor) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result || "");
      if (!src) return;
      editor.chain().focus().setImage({ src, alt: file.name }).run();
    };
    reader.readAsDataURL(file);
  }

  React.useEffect(() => {
    if (!editor) return;
    emitChangesRef.current = false;
    const text = editor.getText();
    setWords(countWords(text));
    onOutlineRef.current?.(parseOutlineFromHtml(editor.getHTML()));
    // Absorb TipTap HTML normalization into baseline without saving
    const handle = window.setTimeout(() => {
      onReadyRef.current?.(editor.getHTML());
      emitChangesRef.current = true;
    }, 0);
    return () => {
      window.clearTimeout(handle);
      emitChangesRef.current = false;
    };
  }, [editor]);

  React.useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (content !== current) {
      emitChangesRef.current = false;
      editor.commands.setContent(content, { emitUpdate: false });
      const text = editor.getText();
      setWords(countWords(text));
      onOutlineRef.current?.(parseOutlineFromHtml(content));
      const handle = window.setTimeout(() => {
        onReadyRef.current?.(editor.getHTML());
        emitChangesRef.current = true;
      }, 0);
      return () => window.clearTimeout(handle);
    }
  }, [content, editor]);

  React.useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editable, editor]);

  if (!editor) {
    return (
      <div
        className={cn(
          "min-h-[11rem] sm:min-h-[24rem] rounded-lg border bg-muted/20 animate-pulse",
          className,
        )}
      />
    );
  }

  function setLink() {
    const prev = editor?.getAttributes("link").href as string | undefined;
    const url = window.prompt("آدرس لینک", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      ?.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }

  const goalProgress =
    wordGoal && wordGoal > 0
      ? Math.min(100, Math.round((words / wordGoal) * 100))
      : null;

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-2", className)} ref={wrapRef}>
      {!focusMode && (
        <div className="sticky top-0 z-10 flex shrink-0 flex-nowrap items-center gap-1 overflow-x-auto rounded-xl border bg-muted/30 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ToolbarButton
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            label="B"
            className="font-bold shrink-0"
            title={tb.bold}
          />
          <ToolbarButton
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            label="I"
            className="italic shrink-0"
            title={tb.italic}
          />
          <ToolbarButton
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            label="S"
            className="line-through shrink-0"
            title={tb.strike}
          />
          <span className="mx-1 h-5 w-px shrink-0 bg-border" />
          <ToolbarButton
            active={editor.isActive("heading", { level: 2 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            label="H2"
            title={tb.h2}
          />
          <span className="hidden sm:contents">
            <ToolbarButton
              active={editor.isActive("heading", { level: 1 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              label="H1"
              title={tb.h1}
            />
            <ToolbarButton
              active={editor.isActive("heading", { level: 3 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              label="H3"
              title={tb.h3}
            />
          </span>
          <span className="mx-1 hidden h-5 w-px bg-border sm:inline-block" />
          <ToolbarButton
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            icon="list"
            title={tb.bulletList}
          />
          <ToolbarButton
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            label="1."
            title={tb.orderedList}
          />
          <ToolbarButton
            active={editor.isActive("taskList")}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            label="☑"
            title={tb.taskList}
          />
          <span className="hidden sm:contents">
            <ToolbarButton
              active={editor.isActive("blockquote")}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              label="❝"
              title={tb.blockquote}
            />
            <ToolbarButton
              active={editor.isActive("codeBlock")}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              label="{}"
              title={tb.codeBlock}
            />
            <ToolbarButton
              active={editor.isActive("link")}
              onClick={setLink}
              icon="link"
              title={tb.link}
            />
            <span className="mx-1 h-5 w-px bg-border" />
            <div className="relative" ref={tablePickerRef}>
              <ToolbarButton
                active={editor.isActive("table") || tablePickerOpen}
                onClick={() => {
                  setTableHover({ rows: 0, cols: 0 });
                  setTablePickerOpen(v => !v);
                }}
                label="▦"
                title={tb.table}
              />
              {tablePickerOpen && (
                <div
                  className={cn(
                    "absolute top-full z-40 mt-1 w-max min-w-[9.5rem] rounded-lg border bg-popover p-2.5 shadow-md",
                    dir === "rtl" ? "right-0" : "left-0",
                  )}
                  role="dialog"
                  aria-label={tb.table}
                >
                  <p className="mb-2 whitespace-nowrap text-[11px] text-muted-foreground">
                    {tb.tableHint}
                    {tableHover.rows > 0
                      ? ` — ${tableHover.rows}×${tableHover.cols}`
                      : ""}
                  </p>
                  <div
                    className="grid w-max gap-1"
                    style={{
                      gridTemplateColumns: `repeat(${TABLE_PICKER_MAX}, 18px)`,
                      gridTemplateRows: `repeat(${TABLE_PICKER_MAX}, 18px)`,
                    }}
                    onMouseLeave={() => setTableHover({ rows: 0, cols: 0 })}
                  >
                    {Array.from(
                      { length: TABLE_PICKER_MAX * TABLE_PICKER_MAX },
                      (_, i) => {
                        const rows = Math.floor(i / TABLE_PICKER_MAX) + 1;
                        const cols = (i % TABLE_PICKER_MAX) + 1;
                        const hot =
                          tableHover.rows > 0 &&
                          rows <= tableHover.rows &&
                          cols <= tableHover.cols;
                        return (
                          <button
                            key={`${rows}x${cols}`}
                            type="button"
                            className={cn(
                              "size-[18px] shrink-0 rounded-[2px] border transition-colors",
                              hot
                                ? "border-primary bg-primary/30"
                                : "border-border bg-muted/50 hover:border-primary/60",
                            )}
                            aria-label={`${rows}×${cols}`}
                            onMouseEnter={() => setTableHover({ rows, cols })}
                            onClick={() => insertTableAt(rows, cols)}
                          />
                        );
                      },
                    )}
                  </div>
                </div>
              )}
            </div>
            {editor.isActive("table") && (
              <>
                <ToolbarButton
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  label="+↕"
                  title={tb.tableAddRow}
                />
                <ToolbarButton
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  label="+↔"
                  title={tb.tableAddCol}
                />
                <ToolbarButton
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  label="−↕"
                  title={tb.tableDelRow}
                />
                <ToolbarButton
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  label="−↔"
                  title={tb.tableDelCol}
                />
                <ToolbarButton
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  label="⌫"
                  title={tb.tableDelete}
                />
              </>
            )}
            <ToolbarButton
              active={false}
              onClick={() => imageInputRef.current?.click()}
              label="🖼"
              title={tb.image}
            />
            <ToolbarButton
              active={editor.isActive("footnote")}
              onClick={() => {
                const text = window.prompt(footnotePromptLabel) || "";
                editor.chain().focus().insertFootnote(text || undefined).run();
              }}
              label="¹"
              title={tb.footnote}
            />
          </span>
          <span className="ms-auto shrink-0 sm:hidden">
            <Menu
              align="end"
              trigger={
                <button
                  type="button"
                  className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                  title={tb.more}
                  aria-label={tb.more}
                >
                  <Icon name="more-horizontal" size={16} />
                </button>
              }
              items={[
                {
                  label: tb.h1,
                  onClick: () =>
                    editor.chain().focus().toggleHeading({ level: 1 }).run(),
                },
                {
                  label: tb.h3,
                  onClick: () =>
                    editor.chain().focus().toggleHeading({ level: 3 }).run(),
                },
                { divider: true },
                {
                  label: tb.blockquote,
                  onClick: () =>
                    editor.chain().focus().toggleBlockquote().run(),
                },
                {
                  label: tb.codeBlock,
                  onClick: () =>
                    editor.chain().focus().toggleCodeBlock().run(),
                },
                { label: tb.link, icon: "link", onClick: setLink },
                { divider: true },
                {
                  label: tb.table,
                  onClick: () => {
                    setTableHover({ rows: 0, cols: 0 });
                    setTablePickerOpen(true);
                  },
                },
                {
                  label: tb.image,
                  onClick: () => imageInputRef.current?.click(),
                },
                {
                  label: tb.footnote,
                  onClick: () => {
                    const text = window.prompt(footnotePromptLabel) || "";
                    editor
                      .chain()
                      .focus()
                      .insertFootnote(text || undefined)
                      .run();
                  },
                },
              ]}
            />
          </span>
        </div>
      )}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          onImageFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />

      <div
        className={cn(
          "relative min-h-0 flex-1 overflow-auto rounded-xl border bg-card px-3 py-3 sm:px-4",
          focusMode &&
            "min-h-[60dvh] border-transparent px-2 shadow-none sm:min-h-[70dvh]",
        )}
      >
        <EditorContent editor={editor} />

        {slash && (
          <div
            className="absolute z-30 w-64 max-h-64 overflow-auto rounded-xl border bg-popover shadow-lg p-1"
            style={{ top: slash.top, left: Math.max(0, slash.left) }}
          >
            {slash.items.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                {slashEmptyLabel}
              </p>
            ) : (
              slash.items.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-start",
                    i === slash.index ? "bg-accent" : "hover:bg-accent/70",
                  )}
                  onMouseDown={e => {
                    e.preventDefault();
                    runSlashRef.current(item.id, slash.from, slash.to);
                  }}
                >
                  <div className="text-sm font-medium">
                    {language === "FA" ? item.labelFa : item.labelEn}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    /{item.aliases[0]} ·{" "}
                    {language === "FA" ? item.hintFa : item.hintEn}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {selectionMenu && (onCreateTaskFromText || onCreateQuoteFromText) && (
          <div
            className="absolute z-30 -translate-x-1/2 flex gap-1"
            style={{ top: selectionMenu.top, left: selectionMenu.left }}
          >
            {onCreateTaskFromText && (
              <Button
                size="sm"
                variant="primary"
                onMouseDown={e => {
                  e.preventDefault();
                  void onCreateTaskFromText(selectionMenu.text);
                  setSelectionMenu(null);
                }}
              >
                <Icon name="plus" size={14} />
                {selectionToTaskLabel}
              </Button>
            )}
            {onCreateQuoteFromText && (
              <Button
                size="sm"
                variant="subtle"
                onMouseDown={e => {
                  e.preventDefault();
                  void onCreateQuoteFromText(selectionMenu.text);
                  setSelectionMenu(null);
                }}
              >
                {selectionToQuoteLabel}
              </Button>
            )}
          </div>
        )}

        {mention && mention.items.length > 0 && (
          <div
            className="absolute z-30 w-64 max-h-56 overflow-auto rounded-xl border bg-popover shadow-lg p-1"
            style={{ top: mention.top, left: Math.max(0, mention.left) }}
          >
            {mention.items.map((item, i) => (
              <button
                key={`${item.kind}-${item.id}`}
                type="button"
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-start",
                  i === mention.index ? "bg-accent" : "hover:bg-accent/70",
                )}
                onMouseDown={e => {
                  e.preventDefault();
                  if (!editor) return;
                  editor
                    .chain()
                    .focus()
                    .deleteRange({ from: mention.from, to: mention.to })
                    .insertContent(
                      `<a href="${item.href}">${item.kind === "doc" ? "📄" : "✓"} ${item.label}</a> `,
                    )
                    .run();
                  setMention(null);
                }}
              >
                <div className="text-sm font-medium truncate">{item.label}</div>
                <div className="text-[11px] text-muted-foreground">
                  {item.kind === "doc" ? "doc" : "task"}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
        <div className="inline-flex min-w-0 items-center gap-2">
          <span className="tabular-nums whitespace-nowrap">
            {words.toLocaleString()} {wordLabel}
            {wordGoal ? ` / ${wordGoal.toLocaleString()}` : ""}
          </span>
          <span className="hidden opacity-35 sm:inline" aria-hidden>
            ·
          </span>
          <span className="hidden items-center gap-1 whitespace-nowrap opacity-60 sm:inline-flex">
            <kbd
              dir="ltr"
              className="rounded border border-border/70 bg-muted/50 px-1 py-px font-mono text-[10px] leading-none"
            >
              /
            </kbd>
            <span>{slashHint}</span>
          </span>
        </div>
        {goalProgress !== null && (
          <div className="flex items-center gap-2 min-w-[120px]">
            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <span>{goalProgress}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

export { scrollDocEditorToHeading } from "./scroll-heading";

function ToolbarButton({
  active,
  onClick,
  label,
  icon,
  className,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  label?: string;
  icon?: "list" | "link";
  className?: string;
  title?: string;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "primary" : "ghost"}
      className={cn("h-8 min-w-8 shrink-0 px-2", className)}
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      {icon ? <Icon name={icon} size={14} /> : label}
    </Button>
  );
}

const TABLE_PICKER_MAX = 6;
