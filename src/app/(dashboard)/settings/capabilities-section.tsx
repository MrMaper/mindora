"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { setMemberModulePreference } from "@/features/modules/actions";
import { setUiProfileAction } from "@/features/onboarding/actions";
import type { UiProfile } from "@/lib/ui-profile";
import {
  MODULE_META,
  PRIMARY_MODULES,
  dependentsOf,
  type ModuleFlags,
  type ModulePolicy,
  type PrimaryModule,
} from "@/lib/modules";
import { cn } from "@/lib/utils";
import { useAppDialogs } from "@/components/ui-kit/overlays/app-dialogs";

export interface CapabilitiesData {
  policy: ModulePolicy;
  flags: ModuleFlags;
  uiProfile: UiProfile;
}

const DESC: Record<PrimaryModule, { fa: string; en: string }> = {
  tasks: {
    fa: "کارها، تقویم، بورد و بازبینی",
    en: "Tasks, calendar, board and review",
  },
  docs: { fa: "یادداشت‌ها و نوشته‌ها", en: "Notes and documents" },
  projects: {
    fa: "قسمت‌های زندگی و پروژه‌ها",
    en: "Areas and projects",
  },
  habits: { fa: "پیگیری عادت‌های روزانه", en: "Daily habit tracking" },
  research: {
    fa: "منابع، مقاله‌ها و پایان‌نامه",
    en: "Sources, papers and thesis work",
  },
  language: {
    fa: "یادگیری زبان: واژه‌ها، تمرین و آزمون",
    en: "Language learning: vocabulary, practice and exams",
  },
  workLogs: { fa: "ثبت ساعت کار", en: "Time tracking" },
  reporting: { fa: "گزارش و خروجی", en: "Reports and exports" },
};

export function CapabilitiesSection({
  data,
  language,
}: {
  data: CapabilitiesData;
  language: "FA" | "EN";
}) {
  const fa = language === "FA";
  const router = useRouter();
  const { confirm } = useAppDialogs();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const visible = PRIMARY_MODULES.filter(k => data.policy[k] !== "off");

  function onToggle(key: PrimaryModule, next: boolean) {
    void (async () => {
      if (!next) {
        const affected = dependentsOf(key).filter(d => data.flags[d]);
        if (affected.length > 0) {
          const names = affected
            .map(d => (fa ? MODULE_META[d].fa : MODULE_META[d].en))
            .join(fa ? "، " : ", ");
          const msg = fa
            ? `«${names}» هم خاموش می‌شود. ادامه می‌دهی؟`
            : `"${names}" will also be turned off. Continue?`;
          if (!(await confirm({ title: msg, danger: true }))) return;
        }
      }
      setError(null);
      startTransition(async () => {
        const res = await setMemberModulePreference(key, next);
        if (!res.success) {
          setError(res.error ?? (fa ? "ذخیره نشد" : "Could not save"));
          return;
        }
        router.refresh();
      });
    })();
  }

  function onProfile(next: UiProfile) {
    setError(null);
    startTransition(async () => {
      const res = await setUiProfileAction(next);
      if (!res.success) {
        setError(res.error ?? (fa ? "ذخیره نشد" : "Could not save"));
        return;
      }
      router.refresh();
    });
  }

  const isFull = data.uiProfile === "full";

  return (
    <section>
      <div className="mb-6 flex max-w-xl items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
        <span className="min-w-0">
          <span className="block text-sm font-medium text-foreground">
            {isFull
              ? fa ? "نمای کامل" : "Full view"
              : fa ? "نمای ساده" : "Simple view"}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {isFull
              ? fa
                ? "همهٔ بخش‌های فعال در منو و صفحهٔ امروز دیده می‌شوند."
                : "Every enabled section shows in the menu and on Today."
              : fa
                ? "منو و صفحهٔ امروز ساده مانده‌اند. هر زمان خواستی بیشتر نشان بده."
                : "Menu and Today stay simple. Show more whenever you like."}
          </span>
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() => onProfile(isFull ? "starter" : "full")}
          className="shrink-0 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-60"
        >
          {isFull
            ? fa ? "ساده‌تر کن" : "Make it simpler"
            : fa ? "قابلیت‌های بیشتر نشان بده" : "Show more features"}
        </button>
      </div>
      <h2 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {fa ? "قابلیت‌ها" : "Capabilities"}
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {fa
          ? "چیزهایی که نیاز نداری را خاموش کن؛ داده‌هایت پاک نمی‌شود."
          : "Turn off what you do not need. Your data is never deleted."}
      </p>

      {error ? (
        <div
          className="mb-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div className="flex max-w-xl flex-col gap-2">
        {visible.map(key => {
          const locked = data.policy[key] === "on";
          const checked = data.flags[key];
          const blockedBy = (MODULE_META[key].dependsOn ?? []).filter(
            d => !data.flags[d],
          );
          const descId = `cap-desc-${key}`;
          return (
            <label
              key={key}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5",
                locked || pending ? "opacity-70" : "cursor-pointer",
              )}
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">
                  {fa ? MODULE_META[key].fa : MODULE_META[key].en}
                </span>
                <span
                  id={descId}
                  className="mt-0.5 block text-xs text-muted-foreground"
                >
                  {fa ? DESC[key].fa : DESC[key].en}
                </span>
                {locked ? (
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {fa
                      ? "مدیر این را فعال نگه داشته"
                      : "Kept on by your admin"}
                  </span>
                ) : blockedBy.length > 0 && !checked ? (
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {fa
                      ? `نیاز به: ${blockedBy.map(d => MODULE_META[d].fa).join("، ")}`
                      : `Needs: ${blockedBy.map(d => MODULE_META[d].en).join(", ")}`}
                  </span>
                ) : null}
              </span>
              <input
                type="checkbox"
                className="size-5 shrink-0 accent-[var(--action-primary)]"
                checked={checked}
                disabled={locked || pending}
                aria-describedby={descId}
                onChange={e => onToggle(key, e.target.checked)}
              />
            </label>
          );
        })}
      </div>
    </section>
  );
}
