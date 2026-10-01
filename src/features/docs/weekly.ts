import { prisma as db } from "@/lib/db";
import {
  formatJalaliShort,
  parseLocalDate,
  startOfZonedWeek,
  zonedDateKey,
} from "@/lib/life";
import { formatHours } from "@/lib/utils";
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
  return `weekly-review:${zonedDateKey(weekStart)}`;
}

function learningsHtml(content: string): string | null {
  const match = content.match(
    /<h3[^>]*>یادگرفته‌ها<\/h3>\s*(<ul[\s\S]*?<\/ul>)/i,
  );
  return match?.[1] ?? null;
}

function buildWeeklyContent(input: {
  completedTitles: string[];
  leftoverTitles: string[];
  inboxTitles: string[];
  hours: number;
  learnings?: string;
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
    <p><strong>ساعت ثبت‌شده:</strong> ${formatHours(input.hours, "FA", 1)}</p>
    <h3>چه تمام شد</h3>
    <ul data-type="taskList">${done}</ul>
    <h3>چه ماند</h3>
    <ul data-type="taskList">${left}</ul>
    <h3>یادگرفته‌ها</h3>
    ${input.learnings ?? "<ul><li></li></ul>"}
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
  const weekStart = startOfZonedWeek();
  const systemKey = weekSystemKey(weekStart);
  const existing = await db.doc.findFirst({
    where: { userId, systemKey },
    select: { id: true },
  });

  const tpl = getDocTemplate("weeklyReview");
  const lang = opts?.language ?? "FA";
  const dateLabel = formatJalaliShort(
    parseLocalDate(zonedDateKey(weekStart)),
    lang,
  );
  const title =
    lang === "EN"
      ? `Weekly review · ${dateLabel}`
      : `بازبینی هفته · ${dateLabel}`;

  const previous = existing ? await getDocById(userId, existing.id) : null;
  const keptLearnings = previous ? learningsHtml(previous.content) : null;
  if (previous && keptLearnings == null) return previous;

  const content = buildWeeklyContent({
    completedTitles: opts?.completedTitles ?? [],
    leftoverTitles: opts?.leftoverTitles ?? [],
    inboxTitles: opts?.inboxTitles ?? [],
    hours: opts?.hours ?? 0,
    learnings: keptLearnings ?? undefined,
  });

  if (previous) {
    if (previous.content === content) return previous;
    await db.doc.update({
      where: { id: previous.id },
      data: { content, contentText: htmlToText(content) },
    });
    return getDocById(userId, previous.id);
  }

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
