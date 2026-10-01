"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslation } from "@/i18n/provider";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { createResearchProjectAction } from "@/features/research/actions";
import type {
  ResearchProjectItem,
  ResearchProjectScope,
} from "@/features/research/types";
import {
  RESEARCH_SCOPE_STORAGE,
  writeResearchScopeCookie,
} from "@/features/research/scope-cookie";
import { cn } from "@/lib/utils";

function persistScope(next: ResearchProjectScope) {
  try {
    localStorage.setItem(RESEARCH_SCOPE_STORAGE, next);
  } catch {
    /* ignore */
  }
  writeResearchScopeCookie(next);
}

export function ResearchProjectSwitcher({
  scope,
  projects,
}: {
  scope: ResearchProjectScope;
  projects: ResearchProjectItem[];
}) {
  const t = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [creating, setCreating] = React.useState(false);
  const [name, setName] = React.useState("");
  const [pending, setPending] = React.useState(false);

  function navigate(next: ResearchProjectScope) {
    persistScope(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("project");
    else params.set("project", next);
    const q = params.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  }

  // Migrate legacy localStorage → cookie; one redirect only if server had no cookie yet.
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(RESEARCH_SCOPE_STORAGE);
      if (saved) writeResearchScopeCookie(saved);
      if (
        !searchParams.get("project") &&
        saved &&
        saved !== "all" &&
        saved !== scope
      ) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("project", saved);
        router.replace(`${pathname}?${params.toString()}`);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onCreate() {
    if (!name.trim()) return;
    setPending(true);
    const result = await createResearchProjectAction({ name: name.trim() });
    setPending(false);
    if (result.success && result.data?.id) {
      setName("");
      setCreating(false);
      navigate(String(result.data.id));
    } else if (result.error) {
      window.alert(result.error);
    }
  }

  return (
    <div className="mb-2 flex flex-col gap-2 sm:mb-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="text-xs text-muted-foreground shrink-0">
          {t.life.researchProject}
        </label>
        <select
          className="h-9 w-full rounded-lg border bg-background px-2 text-sm sm:w-auto sm:min-w-[10rem]"
          value={scope}
          onChange={e => navigate(e.target.value as ResearchProjectScope)}
          aria-label={t.life.researchProject}
        >
          <option value="all">{t.life.researchProjectAll}</option>
          <option value="inbox">{t.life.researchProjectInbox}</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="subtle"
          className="w-full sm:w-auto"
          onClick={() => setCreating(v => !v)}
        >
          {t.life.newResearchProject}
        </Button>
      </div>

      {creating && (
        <div
          className={cn(
            "flex flex-wrap items-end gap-2 rounded-xl border bg-card p-3",
          )}
        >
          <div className="min-w-[12rem] flex-1">
            <label className="text-[11px] text-muted-foreground">
              {t.life.researchProjectName}
            </label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t.life.researchProjectNameHint}
              onKeyDown={e => {
                if (e.key === "Enter") void onCreate();
              }}
            />
          </div>
          <Button
            size="sm"
            disabled={pending || !name.trim()}
            onClick={() => void onCreate()}
          >
            {t.life.createResearchProject}
          </Button>
        </div>
      )}
    </div>
  );
}
