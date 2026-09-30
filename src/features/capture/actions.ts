"use server";

import { cookies } from "next/headers";
import { auth } from "@/auth";
import { createDoc } from "@/features/docs/actions";
import { createHabitAction } from "@/features/habits/actions";
import { quickCapture } from "@/features/life/actions";
import { ensurePersonalWorkspace, projectIdForArea } from "@/features/life/workspace";
import {
  addPhdSourceAction,
  createDocLinkedToTask,
  lookupDoiAction,
} from "@/features/research/actions";
import { RESEARCH_SCOPE_COOKIE } from "@/features/research/scope-cookie";
import { prisma as db } from "@/lib/db";
import { hasModule } from "@/lib/modules";
import { getUserModuleFlags } from "@/lib/require-role";
import { toDateKey } from "@/lib/life";
import type { LifeArea } from "@/types/db";
import {
  captureProduct,
  parseCapture,
  type CaptureKind,
} from "./parse";

const AREAS = new Set<LifeArea>(["PHD", "WORK", "LIFE", "LANG"]);

export interface CaptureResult {
  success: boolean;
  error?: string;
  data?: { id: string; kind: CaptureKind; product?: string };
}

/** Last research path from cookie; null = inbox. Rejects invalid project ids. */
async function resolveCaptureResearchProjectId(
  userId: string,
): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(RESEARCH_SCOPE_COOKIE)?.value;
  if (!raw) return null;
  let scope = raw;
  try {
    scope = decodeURIComponent(raw);
  } catch {
    /* keep raw */
  }
  if (!scope || scope === "all" || scope === "inbox") return null;

  const member = await db.projectMember.findFirst({
    where: {
      userId,
      projectId: scope,
      project: { area: "PHD", status: { not: "ARCHIVED" } },
    },
    select: { id: true },
  });
  return member ? scope : null;
}

export async function universalCapture(input: {
  text: string;
  areaOverride?: LifeArea | null;
  dueDateFallback?: string | null;
  /** Client `Date#getTimezoneOffset()` so date-only noon stays noon on UTC servers. */
  timezoneOffsetMinutes?: number;
}): Promise<CaptureResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  if (session.user.role === "ADMIN") {
    return { success: false, error: "ثبت سریع برای فضای شخصی عضو است" };
  }

  const parsed = parseCapture(input.text);
  const title = parsed.title.trim();
  if (!title) return { success: false, error: "عنوان خالی است" };

  const area =
    input.areaOverride && AREAS.has(input.areaOverride)
      ? input.areaOverride
      : parsed.area;
  const flags = await getUserModuleFlags(session.user.id);
  const product = captureProduct(parsed);

  if (parsed.kind === "note") {
    if (!hasModule(flags, "docs")) {
      return { success: false, error: "نوشته‌ها برای این حساب خاموش است" };
    }
    await ensurePersonalWorkspace(session.user.id);
    const created = await createDoc({
      title,
      area,
      status: "IDEA",
      projectId: projectIdForArea(session.user.id, area),
      content: "<p></p>",
    });
    if (!created.success || !created.data?.id) {
      return { success: false, error: created.error ?? "خطا" };
    }
    return {
      success: true,
      data: { id: created.data.id, kind: "note", product: "note" },
    };
  }

  if (parsed.kind === "habit") {
    if (!hasModule(flags, "habits")) {
      return { success: false, error: "عادت‌ها برای این حساب خاموش است" };
    }
    const cadence = parsed.recurrence === "WEEKLY" ? "WEEKLY" : "DAILY";
    const created = await createHabitAction({ title, area, cadence });
    const id = typeof created.data?.id === "string" ? created.data.id : "";
    if (!created.success || !id) {
      return { success: false, error: created.error ?? "خطا" };
    }
    return { success: true, data: { id, kind: "habit", product: "habit" } };
  }

  if (!hasModule(flags, "tasks")) {
    return { success: false, error: "کارها برای این حساب خاموش است" };
  }

  const fallback =
    input.dueDateFallback && /^\d{4}-\d{2}-\d{2}$/.test(input.dueDateFallback)
      ? input.dueDateFallback
      : undefined;
  const dueDate =
    parsed.dateKey ?? fallback ?? (parsed.time ? toDateKey(new Date()) : undefined);

  // Explicit /source, or /research + DOI → library source + reading card
  if (product === "source" && hasModule(flags, "research")) {
    let sourceTitle = title;
    let authors: string | undefined;
    let year: string | undefined;
    let url = parsed.url ?? undefined;
    let doi = parsed.doi ?? undefined;
    let notes: string | undefined;

    if (doi) {
      const looked = await lookupDoiAction(doi);
      if (looked.success && looked.data) {
        const d = looked.data;
        sourceTitle =
          (typeof d.title === "string" && d.title.trim()) || sourceTitle;
        if (typeof d.authors === "string" && d.authors) authors = d.authors;
        if (typeof d.year === "string" && d.year) year = d.year;
        if (typeof d.url === "string" && d.url) url = d.url;
        if (typeof d.doi === "string" && d.doi) doi = d.doi;
        if (typeof d.notes === "string" && d.notes) notes = d.notes;
      }
    }

    const projectId = await resolveCaptureResearchProjectId(session.user.id);
    const created = await addPhdSourceAction({
      title: sourceTitle,
      authors,
      year,
      url,
      doi,
      notes,
      projectId,
      createReadingCard: true,
      dueDate,
      time: parsed.time,
      durationMinutes: parsed.durationMinutes,
      timezoneOffsetMinutes: input.timezoneOffsetMinutes,
    });
    if (!created.success || !created.data?.id) {
      return { success: false, error: created.error ?? "خطا" };
    }
    const taskId =
      typeof created.data.taskId === "string" ? created.data.taskId : null;
    return {
      success: true,
      data: {
        id: taskId ?? String(created.data.id),
        kind: "task",
        product: "source",
      },
    };
  }

  const created = await quickCapture({
    title,
    area,
    recurrence: parsed.recurrence,
    dueDate,
    time: parsed.time,
    durationMinutes: parsed.durationMinutes,
    timezoneOffsetMinutes: input.timezoneOffsetMinutes,
  });
  if (!created.success || !created.data?.id) {
    return { success: false, error: created.error ?? "خطا" };
  }

  // Only explicit /research (no DOI) attaches a writing doc — not every PhD-area guess.
  if (
    product === "research" &&
    hasModule(flags, "research") &&
    hasModule(flags, "docs")
  ) {
    await createDocLinkedToTask({
      taskId: created.data.id,
      title,
      templateKey: "researchIdea",
    });
  }

  return {
    success: true,
    data: {
      id: created.data.id,
      kind: "task",
      product: product === "research" ? "research" : "task",
    },
  };
}
