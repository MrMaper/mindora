"use client";

import * as React from "react";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { Button } from "@/components/ui-kit/forms/button";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import { useTranslation } from "@/i18n/provider";
import type { DocFolderItem, DocTagItem } from "@/features/docs/types";
import {
  buildFolderTree,
  type FolderTreeNode,
} from "@/features/docs/folder-tree";

interface DocTaxonomyManageDrawerProps {
  open: boolean;
  folders: DocFolderItem[];
  tags: DocTagItem[];
  onClose: () => void;
  onCreateFolder: (parentId?: string | null) => void;
  onEditFolder: (folder: DocFolderItem) => void;
  onDeleteFolder: (id: string) => Promise<void>;
  onCreateTag: () => void;
  onEditTag: (tag: DocTagItem) => void;
  onDeleteTag: (id: string) => Promise<void>;
  onMergeTags: (keepId: string, absorbId: string) => Promise<void>;
}

function FolderRows({
  nodes,
  onEdit,
  onDelete,
  onAddChild,
}: {
  nodes: FolderTreeNode[];
  onEdit: (f: DocFolderItem) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-1">
      {nodes.map(node => (
        <li key={node.id}>
          <div
            className="flex items-center gap-1 rounded-lg border px-2 py-1.5"
            style={{ marginInlineStart: node.depth * 12 }}
          >
            <span className="min-w-0 flex-1 truncate text-sm">{node.name}</span>
            <IconButton
              icon="plus"
              size="sm"
              aria-label="add child"
              onClick={() => onAddChild(node.id)}
            />
            <IconButton
              icon="pencil"
              size="sm"
              aria-label="edit"
              onClick={() => onEdit(node)}
            />
            <IconButton
              icon="trash"
              size="sm"
              aria-label="delete"
              onClick={() => onDelete(node.id)}
            />
          </div>
          {node.children.length > 0 && (
            <FolderRows
              nodes={node.children}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

export function DocTaxonomyManageDrawer({
  open,
  folders,
  tags,
  onClose,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onCreateTag,
  onEditTag,
  onDeleteTag,
  onMergeTags,
}: DocTaxonomyManageDrawerProps) {
  const t = useTranslation();
  const { tree } = React.useMemo(() => buildFolderTree(folders), [folders]);
  const [mergeKeep, setMergeKeep] = React.useState("");
  const [mergeAbsorb, setMergeAbsorb] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setMergeKeep("");
    setMergeAbsorb("");
  }, [open]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      wide
      header={
        <span className="text-sm font-semibold text-text-primary">
          {t.docs.manageTaxonomy}
        </span>
      }
      footer={
        <div className="flex ms-auto">
          <Button variant="ghost" onClick={onClose}>
            {t.common.close}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 py-2">
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">{t.docs.folders}</h3>
            <Button size="sm" variant="subtle" onClick={() => onCreateFolder()}>
              {t.docs.newFolder}
            </Button>
          </div>
          {tree.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3 text-center">
              {t.docs.noFoldersYet}
            </p>
          ) : (
            <FolderRows
              nodes={tree}
              onEdit={onEditFolder}
              onDelete={id => {
                if (!window.confirm(t.docs.deleteFolderConfirm)) return;
                void onDeleteFolder(id);
              }}
              onAddChild={parentId => onCreateFolder(parentId)}
            />
          )}
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">{t.docs.tags}</h3>
            <Button size="sm" variant="subtle" onClick={onCreateTag}>
              {t.docs.newTag}
            </Button>
          </div>
          {tags.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3 text-center">
              {t.docs.noTagsYet}
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {tags.map(tag => (
                <li
                  key={tag.id}
                  className="flex items-center gap-2 rounded-lg border px-2 py-1.5"
                >
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {tag.name}
                  </span>
                  <IconButton
                    icon="pencil"
                    size="sm"
                    aria-label="edit"
                    onClick={() => onEditTag(tag)}
                  />
                  <IconButton
                    icon="trash"
                    size="sm"
                    aria-label="delete"
                    onClick={() => {
                      if (!window.confirm(t.docs.deleteTagConfirm)) return;
                      void onDeleteTag(tag.id);
                    }}
                  />
                </li>
              ))}
            </ul>
          )}

          {tags.length >= 2 && (
            <div className="rounded-xl border p-3 flex flex-col gap-2 mt-1">
              <p className="text-xs font-medium">{t.docs.mergeTags}</p>
              <p className="text-[11px] text-muted-foreground leading-5">
                {t.docs.mergeTagsHint}
              </p>
              <select
                className="h-8 rounded-md border bg-background text-xs"
                value={mergeKeep}
                onChange={e => setMergeKeep(e.target.value)}
              >
                <option value="">{t.docs.mergeKeep}</option>
                {tags.map(tag => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
              <select
                className="h-8 rounded-md border bg-background text-xs"
                value={mergeAbsorb}
                onChange={e => setMergeAbsorb(e.target.value)}
              >
                <option value="">{t.docs.mergeAbsorb}</option>
                {tags
                  .filter(tag => tag.id !== mergeKeep)
                  .map(tag => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
              </select>
              <Button
                size="sm"
                disabled={!mergeKeep || !mergeAbsorb || busy}
                loading={busy}
                onClick={async () => {
                  if (!mergeKeep || !mergeAbsorb) return;
                  if (!window.confirm(t.docs.mergeTagsConfirm)) return;
                  setBusy(true);
                  await onMergeTags(mergeKeep, mergeAbsorb);
                  setBusy(false);
                  setMergeAbsorb("");
                }}
              >
                {t.docs.mergeTags}
              </Button>
            </div>
          )}
        </section>
      </div>
    </Drawer>
  );
}
