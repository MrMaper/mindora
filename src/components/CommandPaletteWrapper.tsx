"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandPalette,
  type CommandGroup,
} from "@/components/ui-kit/overlays/command-palette";
import type { IconName } from "@/components/ui-kit/foundation/icon";
import { useTranslation } from "@/i18n/provider";

interface SearchHit {
  id: string;
  title?: string;
  name?: string;
  status?: string;
  email?: string;
  meta?: string;
  href: string;
}

interface SearchResult {
  tasks: SearchHit[];
  docs: SearchHit[];
  projects: SearchHit[];
  users: SearchHit[];
  vocab?: SearchHit[];
  sources?: SearchHit[];
  listening?: SearchHit[];
  workLogs?: SearchHit[];
}

export function CommandPaletteWrapper({
  initialOpen = false,
}: {
  initialOpen?: boolean;
} = {}) {
  const [open, setOpen] = React.useState(initialOpen);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const t = useTranslation();
  const router = useRouter();

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 220);
    return () => clearTimeout(timer);
  }, [query]);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setDebouncedQuery("");
      setResults(null);
      setLoading(false);
    }
  }, [open]);

  React.useEffect(() => {
    const q = debouncedQuery.trim();
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();

    fetch(`/api/search?q=${encodeURIComponent(q)}`, {
      signal: controller.signal,
    })
      .then(res => res.json())
      .then(data => {
        if (data?.error) setResults(null);
        else setResults(data as SearchResult);
        setLoading(false);
      })
      .catch(err => {
        if (err.name !== "AbortError") {
          setResults(null);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    const handleOpen = () => setOpen(true);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mindora:open-search", handleOpen);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mindora:open-search", handleOpen);
    };
  }, []);

  const go = React.useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const groups: CommandGroup[] = React.useMemo(() => {
    if (!results) return [];
    const list: CommandGroup[] = [];

    if (results.tasks?.length) {
      list.push({
        label: t.nav.tasks,
        items: results.tasks.map(task => ({
          label: task.title ?? "",
          meta: task.meta ?? task.status,
          icon: "list" as IconName,
          onSelect: () => go(task.href),
        })),
      });
    }
    if (results.docs?.length) {
      list.push({
        label: t.nav.docs,
        items: results.docs.map(doc => ({
          label: doc.title ?? "",
          meta: doc.meta,
          icon: "file-text" as IconName,
          onSelect: () => go(doc.href),
        })),
      });
    }
    if (results.projects?.length) {
      list.push({
        label: t.nav.projects,
        items: results.projects.map(project => ({
          label: project.name ?? project.title ?? "",
          meta: project.meta,
          icon: "folder" as IconName,
          onSelect: () => go(project.href),
        })),
      });
    }
    if (results.users?.length) {
      list.push({
        label: t.common.users,
        items: results.users.map(user => ({
          label: user.name ?? "",
          meta: user.email,
          icon: "user" as IconName,
          onSelect: () => go(user.href),
        })),
      });
    }
    if (results.vocab?.length) {
      list.push({
        label: t.nav.language,
        items: results.vocab.map(item => ({
          label: item.title ?? "",
          meta: item.meta,
          icon: "language" as IconName,
          onSelect: () => go(item.href),
        })),
      });
    }
    if (results.listening?.length) {
      list.push({
        label: t.language.tabListening,
        items: results.listening.map(item => ({
          label: item.title ?? "",
          meta: item.meta,
          icon: "volume" as IconName,
          onSelect: () => go(item.href),
        })),
      });
    }
    if (results.sources?.length) {
      list.push({
        label: t.life.researchLibrary,
        items: results.sources.map(item => ({
          label: item.title ?? "",
          meta: item.meta,
          icon: "file-text" as IconName,
          onSelect: () => go(item.href),
        })),
      });
    }
    if (results.workLogs?.length) {
      list.push({
        label: t.nav.workLogs,
        items: results.workLogs.map(item => ({
          label: item.title ?? "",
          meta: item.meta,
          icon: "clock" as IconName,
          onSelect: () => go(item.href),
        })),
      });
    }
    return list;
  }, [results, t, go]);

  const trimmed = query.trim();
  const emptyLabel = loading
    ? t.common.loading
    : trimmed.length < 2
      ? t.common.searchMinChars
      : groups.length === 0
        ? t.common.noSearchResults
        : t.common.search;

  return (
    <CommandPalette
      open={open}
      onClose={() => setOpen(false)}
      placeholder={t.common.searchEverywhere}
      emptyLabel={emptyLabel}
      groups={groups}
      value={query}
      onValueChange={setQuery}
      shouldFilter={false}
    />
  );
}
