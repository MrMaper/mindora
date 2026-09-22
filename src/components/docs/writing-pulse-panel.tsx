"use client";

import * as React from "react";
import Link from "next/link";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { cn, formatNumber } from "@/lib/utils";
import type { WritingPulseItem } from "@/features/docs/types";

const SEVERITY_STYLE = {
  soft: "border-[var(--status-todo)]/30 bg-[var(--status-todo)]/5",
  warn: "border-[var(--status-in-progress)]/35 bg-[var(--status-in-progress)]/8",
  critical:
    "border-[var(--status-blocked)]/40 bg-[var(--status-blocked)]/8",
} as const;

export function WritingPulsePanel({ items }: { items: WritingPulseItem[] }) {
  const t = useTranslation();
  const language = useLanguage();

  if (items.length === 0) return null;

  return (
    <section className="bg-bg-surface border border-border-default rounded-lg p-4 h-full">
      <div className="mb-3">
        <h2 className="text-sm font-semibold">{t.docs.writingPulse}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t.docs.writingPulseHint}
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map(item => (
          <li key={item.id}>
            <Link
              href={`/docs?id=${item.id}`}
              className={cn(
                "block rounded-lg border px-3 py-2.5 transition-colors hover:bg-accent/60",
                SEVERITY_STYLE[item.severity],
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">{item.title}</span>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {formatNumber(item.daysIdle, language)} {t.docs.daysIdle}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-5">
                {language === "FA" ? item.reasonFa : item.reasonEn}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
