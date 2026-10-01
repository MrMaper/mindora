"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { Button } from "@/components/ui-kit/forms/button";
import { WritingPulsePanel } from "@/components/docs/writing-pulse-panel";
import { createDoc } from "@/features/docs/actions";
import { ensurePhdFolderTreeAction } from "@/features/research/actions";
import { DOC_STATUS_HINT } from "@/features/research/types";
import type { DocListItem, WritingPulseItem } from "@/features/docs/types";
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

  function resolvePid() {
    return projectId !== undefined ? projectId : projectIdForCreate();
  }

  async function openTemplate(
    key: "litReview" | "chapterDraft" | "researchIdea",
    pendingKey: string,
  ) {
    const pid = resolvePid();
    if (pid === undefined) {
      window.alert(t.life.pickPathRequired);
      return;
    }
    setPending(pendingKey);
    const result = await createDoc({
      templateKey: key,
      area: "PHD",
      projectId: pid,
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

  function citeFromDoc(docId: string) {
    const params = new URLSearchParams();
    params.set("tab", "library");
    if (typeof projectId === "string") params.set("project", projectId);
    else if (projectId === null) params.set("project", "inbox");
    try {
      sessionStorage.setItem("research-cite-doc", docId);
    } catch {
      /* ignore */
    }
    router.push(`/research?${params.toString()}`);
  }

  const drafting = phdDocs
    .filter(
      d =>
        d.status === "IDEA" || d.status === "DRAFTING" || d.status === "REVIEW",
    )
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

  const resume = drafting[0] ?? null;

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border bg-card p-4">
        <h2 className="text-sm font-semibold">{t.life.researchWritingHub}</h2>
        <p className="text-xs text-muted-foreground mt-0.5 mb-3">
          {t.life.researchWritingHubHint}
        </p>
        <div className="flex flex-wrap gap-2">
          {resume ? (
            <Button
              size="sm"
              className="max-w-full"
              onClick={() => router.push(`/docs?id=${resume.id}`)}
            >
              <span className="truncate">
                {t.life.resumeWriting}: {resume.title}
              </span>
            </Button>
          ) : null}
          <Button
            size="sm"
            variant={resume ? "subtle" : undefined}
            disabled={pending !== null}
            onClick={() => void openTemplate("litReview", "lit")}
          >
            {t.life.tplLitReview}
          </Button>
          <Button
            size="sm"
            variant="subtle"
            disabled={pending !== null}
            onClick={() => void openTemplate("chapterDraft", "chapter")}
          >
            {t.life.chapterDraft}
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

      {drafting.length > 0 ? (
        <section className="rounded-xl border bg-card p-4">
          <h2 className="text-sm font-semibold mb-2">
            {t.life.researchWritingOpen}
          </h2>
          <p className="text-[11px] text-muted-foreground mb-2">
            {t.life.researchWritingOpenHint}
          </p>
          <ul className="flex flex-col gap-1.5">
            {drafting.slice(0, 12).map(doc => {
              const hint = DOC_STATUS_HINT[doc.status];
              return (
                <li
                  key={doc.id}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent"
                >
                  <Link
                    href={`/docs?id=${doc.id}`}
                    className="min-w-0 flex-1 truncate text-sm font-medium"
                  >
                    {doc.title}
                  </Link>
                  <span className="text-[10px] text-muted-foreground shrink-0 rounded border px-1">
                    {language === "FA" ? hint.fa : hint.en}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0 h-7 text-[11px]"
                    onClick={() => citeFromDoc(doc.id)}
                  >
                    {t.life.citeFromHere}
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
