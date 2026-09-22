import type { DocFolderItem } from "./types";

export interface FolderTreeNode extends DocFolderItem {
  depth: number;
  children: FolderTreeNode[];
}

/** Build indented flat list for selects + nested tree. */
export function buildFolderTree(folders: DocFolderItem[]): {
  tree: FolderTreeNode[];
  flat: FolderTreeNode[];
} {
  const byId = new Map<string, FolderTreeNode>();
  for (const f of folders) {
    byId.set(f.id, { ...f, depth: 0, children: [] });
  }
  const roots: FolderTreeNode[] = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const flat: FolderTreeNode[] = [];
  const walk = (nodes: FolderTreeNode[], depth: number) => {
    for (const n of nodes) {
      n.depth = depth;
      flat.push(n);
      walk(n.children, depth + 1);
    }
  };
  walk(roots, 0);
  return { tree: roots, flat };
}

export function folderOptionLabel(node: FolderTreeNode): string {
  const pad = "— ".repeat(node.depth);
  return `${pad}${node.name} (${node.docCount})`;
}
