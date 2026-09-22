import { prisma as db } from "@/lib/db";
import { formatJalaliShort, startOfWeek } from "@/lib/life";
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

function weekSystemKey(weekStart: Date): string {
  const y = weekStart.getFullYear();
  const m = String(weekStart.getMonth() + 1).padStart(2, "0");
  const d = String(weekStart.getDate()).padStart(2, "0");
  return `weekly-review:${y}-${m}-${d}`;
}

function buildWeeklyContent(input: {
  completedTitles: string[];
  leftoverTitles: string[];
  inboxTitles: string[];
  hours: number;
}): string {
  const done =
    input.completedTitles.length > 0
      ? input.completedTitles
          .map(
            t =>
              `<li data-checked="true" data-type="taskItem"><label><input type="checkbox" checked><span></span></label><div><p>${escape(
                t,
              )}</p></div></li>`,
          )
          .join("")
      : `<li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div><p></p></div></li>`;

  const left =
    input.leftoverTitles.length > 0
      ? input.leftoverTitles
          .map(
            t =>
              `<li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div><p>${escape(
                t,
              )}</p></div></li>`,
          )
          .join("")
      : `<li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div><p></p></div></li>`;

  const next =
    input.inboxTitles.length > 0
      ? input.inboxTitles
          .slice(0, 8)
          .map(
            t =>
              `<li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div><p>${escape(
                t,
              )}</p></div></li>`,
          )
          .join("")
      : `<li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div><p></p></div></li>`;

  return ensureHeadingIds(`
    <h2>بازبینی هفته</h2>
    <p><strong>ساعت ثبت‌شده:</strong> ${input.hours.toFixed(1)}</p>
    <h3>چه تمام شد</h3>
    <ul data-type="taskList">${done}</ul>
    <h3>چه ماند</h3>
    <ul data-type="taskList">${left}</ul>
    <h3>یادگرفته‌ها</h3>
    <ul><li></li></ul>
    <h3>هفته بعد</h3>
    <ul data-type="taskList">${next}</ul>
  `);
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Find or create this week's review note, seeded from weekly review stats. */
export async function ensureWeeklyReviewDoc(
  userId: string,
  opts?: {
    completedTitles?: string[];
    leftoverTitles?: string[];
    inboxTitles?: string[];
    hours?: number;
    language?: "FA" | "EN";
  },
): Promise<DocDetail | null> {
  const weekStart = startOfWeek(new Date());
  const systemKey = weekSystemKey(weekStart);
  const existing = await db.doc.findFirst({
    where: { userId, systemKey },
    select: { id: true },
  });
  if (existing) return getDocById(userId, existing.id);

  const tpl = getDocTemplate("weeklyReview");
  const lang = opts?.language ?? "FA";
  const dateLabel = formatJalaliShort(weekStart, lang);
  const title =
    lang === "EN"
      ? `Weekly review · ${dateLabel}`
      : `بازبینی هفته · ${dateLabel}`;

  const content = buildWeeklyContent({
    completedTitles: opts?.completedTitles ?? [],
    leftoverTitles: opts?.leftoverTitles ?? [],
    inboxTitles: opts?.inboxTitles ?? [],
    hours: opts?.hours ?? 0,
  });

  const doc = await db.doc.create({
    data: {
      title,
      content,
      contentText: htmlToText(content),
      area: tpl.area,
      status: "REVIEW",
      templateKey: tpl.key,
      systemKey,
      userId,
      pinned: true,
    },
    select: { id: true },
  });

  return getDocById(userId, doc.id);
}
