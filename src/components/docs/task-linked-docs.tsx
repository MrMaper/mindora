"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listDocsForTaskAction } from "@/features/docs/actions";
import { createDocLinkedToTask } from "@/features/research/actions";
import { useTranslation } from "@/i18n/provider";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Button } from "@/components/ui-kit/forms/button";
import { cn } from "@/lib/utils";
import type { LifeArea } from "@/types/db";

const AREA_DOT: Record<LifeArea, string> = {
  PHD: "bg-[var(--status-review)]",
  WORK: "bg-[var(--status-in-progress)]",
  LIFE: "bg-[var(--status-todo)]",
  LANG: "bg-emerald-600",
};

export function TaskLinkedDocs({ taskId }: { taskId: string }) {
  const t = useTranslation();
  const router = useRouter();
  const [docs, setDocs] = React.useState<
    { id: string; title: string; area: LifeArea }[]
  >([]);
  const [pending, setPending] = React.useState(false);

  async function reload() {
    const rows = await listDocsForTaskAction(taskId);
    setDocs(rows);
  }

  React.useEffect(() => {
    let cancelled = false;
    void listDocsForTaskAction(taskId).then(rows => {
      if (!cancelled) setDocs(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  async function createLinked() {
    setPending(true);
    const result = await createDocLinkedToTask({
      taskId,
      templateKey: "researchIdea",
    });
    setPending(false);
    if (result.success && result.data?.id) {
      await reload();
      router.push(`/docs?id=${String(result.data.id)}`);
    } else if (result.error) {
      window.alert(result.error);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-2xs font-semibold uppercase tracking-caps text-text-tertiary">
          {t.docs.linkedDocs}
        </div>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => void createLinked()}
        >
          {t.life.linkNewDoc}
        </Button>
      </div>
      {docs.length === 0 ? (
        <p className="text-xs text-muted-foreground py-1">
          {t.life.noLinkedDocs}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {docs.map(doc => (
            <li key={doc.id}>
              <Link
                href={`/docs?id=${doc.id}`}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent"
              >
                <span className={cn("size-2 rounded-full", AREA_DOT[doc.area])} />
                <span className="min-w-0 flex-1 truncate font-medium">
                  {doc.title}
                </span>
                <Icon name="file-text" size={14} className="text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
