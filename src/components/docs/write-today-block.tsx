"use client";

import * as React from "react";
import Link from "next/link";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { formatJalaliShort } from "@/lib/life";
import { cn, formatNumber } from "@/lib/utils";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Button } from "@/components/ui-kit/forms/button";
import type { DocListItem } from "@/features/docs/types";
import type { LifeArea } from "@/types/db";
import { openDailyNoteAction, openWeeklyReviewDocAction } from "@/features/docs/actions";
import { useRouter } from "next/navigation";

const AREA_DOT: Record<LifeArea, string> = {
  PHD: "bg-[var(--status-review)]",
  WORK: "bg-[var(--status-in-progress)]",
  LIFE: "bg-[var(--status-todo)]",
  LANG: "bg-emerald-600",
};

export function WriteTodayBlock({
  recent,
  phd,
}: {
  recent: DocListItem[];
  phd: DocListItem[];
}) {
  const t = useTranslation();
  const language = useLanguage();
  const router = useRouter();
  const [pending, setPending] = React.useState<"weekly" | "daily" | null>(null);

  async function openWeekly() {
    setPending("weekly");
    const result = await openWeeklyReviewDocAction({ language });
    setPending(null);
    if (result.success && result.data?.id) {
      router.push(`/docs?id=${result.data.id}`);
    }
  }

  async function openDaily() {
    setPending("daily");
    const result = await openDailyNoteAction({ language });
    setPending(null);
    if (result.success && result.data?.id) {
      router.push(`/docs?id=${result.data.id}`);
    }
  }

  return (
    <section className="bg-bg-surface border border-border-default rounded-lg p-4 h-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-semibold">{t.docs.writeToday}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t.docs.writeTodayHint}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="subtle"
            onClick={() => router.push("/docs")}
          >
            {t.docs.openDocs}
          </Button>
          <Button
            size="sm"
            variant="subtle"
            disabled={pending !== null}
            onClick={() => void openDaily()}
          >
            {t.docs.dailyNote}
          </Button>
          <Button
            size="sm"
            variant="subtle"
            disabled={pending !== null}
            onClick={() => void openWeekly()}
          >
            {t.docs.weeklyReviewNote}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <DocMiniList
          title={t.docs.recentDocs}
          empty={t.docs.noRecentDocs}
          docs={recent}
          language={language}
          wordLabel={t.docs.wordCount}
        />
        <DocMiniList
          title={t.docs.phdDocs}
          empty={t.docs.noPhdDocs}
          docs={phd}
          language={language}
          wordLabel={t.docs.wordCount}
          showDot
        />
      </div>
    </section>
  );
}

function DocMiniList({
  title,
  empty,
  docs,
  language,
  wordLabel,
  showDot,
}: {
  title: string;
  empty: string;
  docs: DocListItem[];
  language: "FA" | "EN";
  wordLabel: string;
  showDot?: boolean;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
        {showDot && (
          <span className={cn("size-2 rounded-full", AREA_DOT.PHD)} />
        )}
        {title}
      </h3>
      {docs.length === 0 ? (
        <p className="text-xs text-muted-foreground py-3">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {docs.map(doc => (
            <li key={doc.id}>
              <Link
                href={`/docs?id=${doc.id}`}
                className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-accent transition-colors"
              >
                <span
                  className={cn(
                    "size-2 rounded-full shrink-0",
                    AREA_DOT[doc.area],
                  )}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {doc.title}
                </span>
                {doc.pinned && (
                  <Icon name="flag" size={12} className="text-primary shrink-0" />
                )}
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {doc.wordCount > 0
                    ? `${formatNumber(doc.wordCount, language)} ${wordLabel}`
                    : formatJalaliShort(new Date(doc.updatedAt), language)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
