"use server";

import { auth } from "@/auth";
import { createDoc } from "@/features/docs/actions";
import { createHabitAction } from "@/features/habits/actions";
import { quickCapture } from "@/features/life/actions";
import { ensurePersonalWorkspace, projectIdForArea } from "@/features/life/workspace";
import { hasModule } from "@/lib/modules";
import { getUserModuleFlags } from "@/lib/require-role";
import { toDateKey } from "@/lib/life";
import type { LifeArea } from "@/types/db";
import { parseCapture, type CaptureKind } from "./parse";

const AREAS = new Set<LifeArea>(["PHD", "WORK", "LIFE", "LANG"]);

export interface CaptureResult {
  success: boolean;
  error?: string;
  data?: { id: string; kind: CaptureKind };
}

export async function universalCapture(input: {
  text: string;
  areaOverride?: LifeArea | null;
  dueDateFallback?: string | null;
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
    return { success: true, data: { id: created.data.id, kind: "note" } };
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
    return { success: true, data: { id, kind: "habit" } };
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

  const created = await quickCapture({
    title,
    area,
    recurrence: parsed.recurrence,
    dueDate,
    time: parsed.time,
    durationMinutes: parsed.durationMinutes,
  });
  if (!created.success || !created.data?.id) {
    return { success: false, error: created.error ?? "خطا" };
  }
  return { success: true, data: { id: created.data.id, kind: "task" } };
}
