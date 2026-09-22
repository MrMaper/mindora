"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslation } from "@/i18n/provider";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { createLangProjectAction } from "@/features/language/actions";
import type {
  LanguageProjectItem,
  LanguageProjectScope,
} from "@/features/language/types";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "language-project-scope";

export function LanguageProjectSwitcher({
  scope,
  projects,
}: {
  scope: LanguageProjectScope;
  projects: LanguageProjectItem[];
}) {
  const t = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [creating, setCreating] = React.useState(false);
  const [name, setName] = React.useState("");
  const [pending, setPending] = React.useState(false);

  function navigate(next: LanguageProjectScope) {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("project");
    else params.set("project", next);
    const q = params.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  }

  React.useEffect(() => {
    if (searchParams.get("project")) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved !== "all") {
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
    const result = await createLangProjectAction({ name: name.trim() });
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
    <div className="mb-3 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-muted-foreground shrink-0">
          {t.language.project}
        </label>
        <select
          className="h-9 min-w-[10rem] rounded-lg border bg-background px-2 text-sm"
          value={scope}
          onChange={e => navigate(e.target.value as LanguageProjectScope)}
          aria-label={t.language.project}
        >
          <option value="all">{t.language.projectAll}</option>
          <option value="inbox">{t.language.projectInbox}</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="subtle"
          onClick={() => setCreating(v => !v)}
        >
          {t.language.newProject}
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
              {t.language.projectName}
            </label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t.language.projectNameHint}
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
            {t.language.createProject}
          </Button>
        </div>
      )}
    </div>
  );
}
