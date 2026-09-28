"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listDocsForTaskAction } from "@/features/docs/actions";
import {
  attachSourceToTaskAction,
  createDocLinkedToTask,
  listResearchSourcesAction,
} from "@/features/research/actions";
import { useTranslation } from "@/i18n/provider";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
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
  const [attachOpen, setAttachOpen] = React.useState(false);
  const [attachQuery, setAttachQuery] = React.useState("");
  const [sourceHits, setSourceHits] = React.useState<
    { id: string; title: string }[]
  >([]);

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

  React.useEffect(() => {
    if (!attachOpen || attachQuery.trim().length < 1) {
      setSourceHits([]);
      return;
    }
    let cancelled = false;
    const handle = window.setTimeout(() => {
      void listResearchSourcesAction({ search: attachQuery }).then(rows => {
        if (!cancelled) {
          setSourceHits(rows.map(r => ({ id: r.id, title: r.title })));
        }
      });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [attachOpen, attachQuery]);

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

  async function attachSource(sourceId: string) {
    setPending(true);
    const result = await attachSourceToTaskAction({ taskId, sourceId });
    setPending(false);
    if (result.success) {
      setAttachOpen(false);
      setAttachQuery("");
      await reload();
      if (result.data?.docId) {
        router.push(`/docs?id=${String(result.data.docId)}`);
      } else {
        router.refresh();
      }
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
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => setAttachOpen(o => !o)}
          >
            {t.life.attachSourceFromCard}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => void createLinked()}
          >
            {t.life.linkNewDoc}
          </Button>
        </div>
      </div>
      {attachOpen ? (
        <div className="mb-2 flex flex-col gap-1.5 rounded-lg border p-2">
          <Input
            value={attachQuery}
            onChange={e => setAttachQuery(e.target.value)}
            placeholder={t.life.librarySearch}
          />
          {sourceHits.map(s => (
            <button
              key={s.id}
              type="button"
              disabled={pending}
              className="rounded-md border px-2 py-1.5 text-start text-xs hover:bg-accent"
              onClick={() => void attachSource(s.id)}
            >
              {s.title}
            </button>
          ))}
        </div>
      ) : null}
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
