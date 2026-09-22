"use client";

import * as React from "react";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Textarea } from "@/components/ui-kit/forms/textarea";
import { useTranslation } from "@/i18n/provider";
import { LIFE_AREAS } from "@/lib/life";
import { cn } from "@/lib/utils";
import type { LifeArea } from "@/types/db";
import type { DocFolderItem, DocTagItem } from "@/features/docs/types";
import {
  buildFolderTree,
  folderOptionLabel,
} from "@/features/docs/folder-tree";

export type TaxonomyDrawerMode = "folder" | "tag";

const TAG_COLORS = [
  "#636e87",
  "#3b82f6",
  "#0d9488",
  "#16a34a",
  "#ca8a04",
  "#ea580c",
  "#dc2626",
  "#db2777",
  "#7c3aed",
] as const;

export interface TaxonomyFormValue {
  name: string;
  description?: string | null;
  area?: LifeArea | null;
  parentId?: string | null;
  color?: string;
}

interface DocTaxonomyDrawerProps {
  open: boolean;
  mode: TaxonomyDrawerMode;
  onClose: () => void;
  folders?: DocFolderItem[];
  /** When set, drawer edits this item instead of creating. */
  editFolder?: DocFolderItem | null;
  editTag?: DocTagItem | null;
  initialParentId?: string | null;
  onSubmit: (input: TaxonomyFormValue) => Promise<boolean>;
}

function areaLabel(
  area: LifeArea,
  t: { phd: string; work: string; lifeArea: string; language?: string },
) {
  if (area === "PHD") return t.phd;
  if (area === "WORK") return t.work;
  if (area === "LANG") return t.language ?? "Language";
  return t.lifeArea;
}

export function DocTaxonomyDrawer({
  open,
  mode,
  onClose,
  folders = [],
  editFolder = null,
  editTag = null,
  initialParentId = null,
  onSubmit,
}: DocTaxonomyDrawerProps) {
  const t = useTranslation();
  const editing = mode === "folder" ? !!editFolder : !!editTag;
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [area, setArea] = React.useState<LifeArea | "">("");
  const [parentId, setParentId] = React.useState<string>("");
  const [color, setColor] = React.useState<string>(TAG_COLORS[0]);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { flat } = React.useMemo(() => buildFolderTree(folders), [folders]);
  const parentOptions = flat.filter(f => f.id !== editFolder?.id);

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setPending(false);
    if (mode === "folder" && editFolder) {
      setName(editFolder.name);
      setDescription(editFolder.description ?? "");
      setArea(editFolder.area ?? "");
      setParentId(editFolder.parentId ?? "");
    } else if (mode === "tag" && editTag) {
      setName(editTag.name);
      setDescription(editTag.description ?? "");
      setColor(editTag.color || TAG_COLORS[0]);
    } else {
      setName("");
      setDescription("");
      setArea("");
      setParentId(initialParentId ?? "");
      setColor(TAG_COLORS[0]);
    }
  }, [open, mode, editFolder, editTag, initialParentId]);

  const title =
    mode === "folder"
      ? editing
        ? t.docs.editFolder
        : t.docs.newFolder
      : editing
        ? t.docs.editTag
        : t.docs.newTag;
  const nameLabel =
    mode === "folder" ? t.docs.folderNamePrompt : t.docs.tagNamePrompt;
  const descriptionLabel =
    mode === "folder" ? t.docs.folderDescription : t.docs.tagDescription;
  const descriptionHint =
    mode === "folder"
      ? t.docs.folderDescriptionHint
      : t.docs.tagDescriptionHint;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(nameLabel);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const ok = await onSubmit({
        name: trimmed,
        description: description.trim() || null,
        area: mode === "folder" ? area || null : undefined,
        parentId: mode === "folder" ? parentId || null : undefined,
        color: mode === "tag" ? color : undefined,
      });
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
        <span className="text-sm font-semibold text-text-primary">{title}</span>
      }
      footer={
        <div className="flex gap-2 ms-auto">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            {t.common.cancel}
          </Button>
          <Button
            variant="primary"
            loading={pending}
            type="submit"
            form="doc-taxonomy-form"
          >
            {editing ? t.common.save : t.common.add}
          </Button>
        </div>
      }
    >
      <form
        id="doc-taxonomy-form"
        onSubmit={e => void handleSubmit(e)}
        className="flex flex-col gap-4 py-2"
      >
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="taxonomy-name"
            className="text-xs font-medium text-muted-foreground"
          >
            {nameLabel}
          </label>
          <Input
            id="taxonomy-name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={nameLabel}
            disabled={pending}
            autoComplete="off"
            autoFocus
          />
        </div>

        <Textarea
          id="taxonomy-description"
          label={descriptionLabel}
          hint={descriptionHint}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={descriptionHint}
          disabled={pending}
          rows={3}
          className="min-h-[80px] resize-y text-sm"
        />

        {mode === "folder" && (
          <>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {t.docs.folderParent}
              </span>
              <select
                className="h-9 rounded-md border bg-background text-sm"
                value={parentId}
                disabled={pending}
                onChange={e => setParentId(e.target.value)}
              >
                <option value="">{t.docs.folderRoot}</option>
                {parentOptions.map(f => (
                  <option key={f.id} value={f.id}>
                    {folderOptionLabel(f)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {t.docs.folderAreaOptional}
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setArea("")}
                  className={cn(
                    "rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                    area === ""
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  {t.docs.filterAll}
                </button>
                {LIFE_AREAS.map(a => (
                  <button
                    key={a}
                    type="button"
                    disabled={pending}
                    onClick={() => setArea(a)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                      area === a
                        ? "border-primary bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {areaLabel(a, t.life)}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {mode === "tag" && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {t.docs.tagColor}
            </span>
            <div className="flex flex-wrap gap-2">
              {TAG_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  disabled={pending}
                  aria-label={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-7 rounded-full border-2 transition-transform",
                    color === c
                      ? "scale-110 border-foreground"
                      : "border-transparent opacity-80 hover:opacity-100",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-[var(--status-blocked)]">{error}</p>
        )}
      </form>
    </Drawer>
  );
}
