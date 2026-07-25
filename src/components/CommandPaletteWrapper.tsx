"use client";

import * as React from "react";
import {
  CommandPalette,
  type CommandGroup,
} from "@/components/ui-kit/overlays/command-palette";
import type { IconName } from "@/components/ui-kit/foundation/icon";
import { useTranslation } from "@/i18n/provider";

interface SearchResult {
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    projectId?: string;
  }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

export function CommandPaletteWrapper() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const t = useTranslation();

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Search on debounced query change
  React.useEffect(() => {
    if (!debouncedQuery.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults(null);
      return;
    }

    setLoading(true);
    const controller = new AbortController();

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, {
      signal: controller.signal,
    })
      .then(res => res.json())
      .then(data => {
        setResults(data);
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

  // Handle keyboard shortcut ⌘K / Ctrl+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Build command groups from results
  const groups: CommandGroup[] = React.useMemo(() => {
    if (!results) return [];

    const taskItems = results.tasks.map(task => ({
      label: task.title,
      meta: task.status,
      icon: "folder" as IconName,
      onSelect: () => {
        window.location.href = `/tasks/${task.id}`;
        setOpen(false);
      },
    }));

    const userItems = results.users.map(user => ({
      label: user.name,
      meta: user.email,
      icon: "user" as IconName,
      onSelect: () => {
        window.location.href = `/users/${user.id}`;
        setOpen(false);
      },
    }));

    const groupList: CommandGroup[] = [];

    if (taskItems.length > 0) {
      groupList.push({
        label: t.common.tasks,
        items: taskItems,
      });
    }

    if (userItems.length > 0) {
      groupList.push({
        label: t.common.users,
        items: userItems,
      });
    }

    return groupList;
  }, [results, t]);

  const placeholder = loading ? t.common.loading : t.common.search;

  return (
    <CommandPalette
      open={open}
      onClose={() => setOpen(false)}
      placeholder={placeholder}
      groups={groups}
    >
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder}
        autoFocus
        style={{
          display: "none", // Hide the default input, we'll use our own approach
        }}
      />
    </CommandPalette>
  );
}
