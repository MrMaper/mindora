"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { Button } from "@/components/ui-kit/forms/button";
import { WritingPulsePanel } from "@/components/docs/writing-pulse-panel";
import {
  createDoc,
} from "@/features/docs/actions";
import { ensurePhdFolderTreeAction } from "@/features/research/actions";
import { DOC_STATUS_HINT } from "@/features/research/types";
import type { DocListItem, WritingPulseItem } from "@/features/docs/types";
import { formatNumber } from "@/lib/utils";
import { formatJalaliShort } from "@/lib/life";
import { projectIdForCreate } from "@/features/research/active-project";

export function ResearchWritingPanel({
  phdDocs,
  pulse,
  projectId,
}: {
  phdDocs: DocListItem[];
  pulse: WritingPulseItem[];
  projectId?: string | null;
}) {
  const t = useTranslation();
  const language = useLanguage();
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  async function openLitReview() {
    setPending("lit");
    const pid = projectId !== undefined ? projectId : projectIdForCreate();
    const result = await createDoc({
      templateKey: "litReview",
      area: "PHD",
      ...(pid !== undefined ? { projectId: pid } : {}),
    });
    setPending(null);
    if (result.success && result.data?.id) {
      router.push(`/docs?id=${result.data.id}`);
    }
  }

  async function ensureFolders() {
    setPending("folders");
    await ensurePhdFolderTreeAction({ language });
    setPending(null);
    router.push("/docs");
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border bg-card p-4">
        <h2 className="text-sm font-semibold">{t.life.researchWritingHub}</h2>
        <p className="text-xs text-muted-foreground mt-0.5 mb-3">
          {t.life.researchWritingHubHint}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={pending !== null}
            onClick={() => void openLitReview()}
          >
            {t.life.tplLitReview}
          </Button>
          <Button
            size="sm"
            variant="subtle"
            disabled={pending !== null}
            onClick={() => void ensureFolders()}
          >
            {t.life.ensurePhdFolders}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push("/docs")}
          >
            {t.docs.openDocs}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-3 leading-5">
          {t.life.versionHint}
        </p>
      </section>

      <WritingPulsePanel items={pulse} />

      <section className="rounded-xl border bg-card p-4">
        <h2 className="text-sm font-semibold mb-2">{t.life.researchPhdDocs}</h2>
        {phdDocs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3">{t.docs.noPhdDocs}</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {phdDocs.map(doc => {
              const hint = DOC_STATUS_HINT[doc.status];
              return (
                <li key={doc.id}>
                  <Link
                    href={`/docs?id=${doc.id}`}
                    className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 hover:bg-accent/60"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {doc.title}
                    </span>
                    <span className="text-[10px] rounded border px-1.5 py-0.5 text-muted-foreground">
                      {language === "FA" ? hint.fa : hint.en}
                    </span>
                    {doc.wordCount > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {formatNumber(doc.wordCount, language)} {t.docs.wordCount}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {formatJalaliShort(new Date(doc.updatedAt), language)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
