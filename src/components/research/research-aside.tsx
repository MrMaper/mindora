"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { Button } from "@/components/ui-kit/forms/button";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { cn, formatNumber } from "@/lib/utils";
import { formatJalaliShort } from "@/lib/life";
import {
  createDoc,
  openDailyNoteAction,
} from "@/features/docs/actions";
import type { DocListItem } from "@/features/docs/types";
import type { ResearchQuoteItem } from "@/features/research/types";
import { DOC_STATUS_HINT } from "@/features/research/types";
import type { DocTemplateKey } from "@/features/docs/templates";
import { projectIdForCreate } from "@/features/research/active-project";

export function ResearchPipelineAside({
  phdDocs,
  quotes,
  projectId,
}: {
  phdDocs: DocListItem[];
  quotes: ResearchQuoteItem[];
  /** undefined = inherit from switcher / all; null = inbox */
  projectId?: string | null;
}) {
  const t = useTranslation();
  const language = useLanguage();
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  function resolveProjectId(): string | null | undefined {
    if (projectId !== undefined) return projectId;
    return projectIdForCreate();
  }

  async function openDaily() {
    setPending("daily");
    const result = await openDailyNoteAction({ language });
    setPending(null);
    if (result.success && result.data?.id) {
      router.push(`/docs?id=${result.data.id}`);
    }
  }

  async function fromTemplate(key: DocTemplateKey) {
    setPending(key);
    const pid = resolveProjectId();
    const result = await createDoc({
      templateKey: key,
      area: "PHD",
      ...(pid !== undefined ? { projectId: pid } : {}),
    });
    setPending(null);
    if (result.success && result.data?.id) {
      router.push(`/docs?id=${result.data.id}`);
    }
  }

  return (
    <aside className="flex flex-col gap-3 min-w-0">
      <section className="rounded-xl border bg-card p-3">
        <h2 className="text-sm font-semibold mb-1">{t.life.researchWrite}</h2>
        <p className="text-[11px] text-muted-foreground mb-3">
          {t.life.researchWriteHint}
        </p>
        <div className="flex flex-wrap gap-1.5">
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
            onClick={() => void fromTemplate("researchIdea")}
          >
            {t.life.tplIdea}
          </Button>
          <Button
            size="sm"
            variant="subtle"
            disabled={pending !== null}
            onClick={() => void fromTemplate("chapterDraft")}
          >
            {t.life.tplChapter}
          </Button>
          <Button
            size="sm"
            variant="subtle"
            disabled={pending !== null}
            onClick={() => void fromTemplate("sourceNote")}
          >
            {t.life.tplSource}
          </Button>
          <Button
            size="sm"
            variant="subtle"
            disabled={pending !== null}
            onClick={() => void fromTemplate("litReview")}
          >
            {t.life.tplLitReview}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push("/docs")}
          >
            {t.docs.openDocs}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-3">
        <h2 className="text-sm font-semibold mb-2">{t.life.researchPhdDocs}</h2>
        {phdDocs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            {t.docs.noPhdDocs}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {phdDocs.slice(0, 8).map(doc => {
              const hint = DOC_STATUS_HINT[doc.status];
              return (
                <li key={doc.id}>
                  <Link
                    href={`/docs?id=${doc.id}`}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {doc.title}
                    </span>
                    <span
                      className="text-[10px] text-muted-foreground shrink-0 rounded border px-1"
                      title={language === "FA" ? hint.fa : hint.en}
                    >
                      {language === "FA" ? hint.fa : hint.en}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {doc.wordCount > 0
                        ? formatNumber(doc.wordCount, language)
                        : formatJalaliShort(
                            new Date(doc.updatedAt),
                            language,
                          )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-xl border bg-card p-3">
        <h2 className="text-sm font-semibold mb-2">{t.life.researchQuotes}</h2>
        {quotes.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            {t.life.researchQuotesEmpty}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {quotes.slice(0, 6).map(q => (
              <li key={q.id}>
                <Link
                  href={`/docs?id=${q.docId}`}
                  className="block rounded-lg border px-2.5 py-2 hover:bg-accent/60"
                >
                  <p className="text-xs leading-5 line-clamp-3">{q.text}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Icon name="file-text" size={11} />
                    <span className="truncate">{q.docTitle}</span>
                    {q.sourceTitle && (
                      <>
                        <span>·</span>
                        <span className="truncate">{q.sourceTitle}</span>
                      </>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}

export function ResearchTabBar({
  tab,
  onChange,
}: {
  tab: "pipeline" | "library" | "writing";
  onChange: (tab: "pipeline" | "library" | "writing") => void;
}) {
  const t = useTranslation();
  const items: { id: typeof tab; label: string }[] = [
    { id: "pipeline", label: t.life.researchTabPipeline },
    { id: "library", label: t.life.researchTabLibrary },
    { id: "writing", label: t.life.researchTabWriting },
  ];
  return (
    <div className="mb-2 flex gap-1 rounded-xl border bg-muted/30 p-0.5 sm:mb-3 sm:p-1">
      {items.map(item => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            "flex-1 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors sm:py-2",
            tab === item.id
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
