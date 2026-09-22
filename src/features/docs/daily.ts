import { prisma as db } from "@/lib/db";
import { formatJalaliDate, startOfDay } from "@/lib/life";
import { getDocTemplate } from "./templates";
import { ensureHeadingIds } from "./utils";
import { getDocById } from "./queries";
import type { DocDetail } from "./types";

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function daySystemKey(day: Date): string {
  const d = startOfDay(day);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dayNum = String(d.getDate()).padStart(2, "0");
  return `daily-note:${y}-${m}-${dayNum}`;
}

/** Find or create today's daily note (Jalali-titled). */
export async function ensureDailyNote(
  userId: string,
  opts?: { language?: "FA" | "EN"; date?: Date },
): Promise<DocDetail | null> {
  const day = opts?.date ?? new Date();
  const systemKey = daySystemKey(day);
  const existing = await db.doc.findFirst({
    where: { userId, systemKey },
    select: { id: true },
  });
  if (existing) return getDocById(userId, existing.id);

  const lang = opts?.language ?? "FA";
  const tpl = getDocTemplate("daily");
  const dateLabel = formatJalaliDate(day, lang);
  const title =
    lang === "EN" ? `Daily note · ${dateLabel}` : `یادداشت روزانه · ${dateLabel}`;
  const content = ensureHeadingIds(tpl.content);

  const doc = await db.doc.create({
    data: {
      title,
      content,
      contentText: htmlToText(content),
      area: "LIFE",
      status: "DRAFTING",
      templateKey: tpl.key,
      systemKey,
      userId,
      pinned: false,
    },
    select: { id: true },
  });

  return getDocById(userId, doc.id);
}
