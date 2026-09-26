"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import { isUserAreaBucket } from "@/lib/life";
import type { LangSkill } from "@/types/db";
import { Prisma } from "../../../prisma/generated/client";
import { createDoc } from "@/features/docs/actions";
import { LANG_SKILLS } from "./types";
import { scheduleAfterReview, type VocabRating } from "./srs";
import {
  getExamTemplate,
  scoreMockSections,
  type ExamKindKey,
  type MockSectionResult,
} from "./exam-templates";
import { deckTag, loadVocabDeck } from "./decks";
import { LISTENING_STARTERS } from "./listening-starters";
import { parseListeningSource } from "./listening-source";
import { startOfAppDay } from "./day";
import {
  listLangProjects,
  parseLanguageProjectScope,
} from "./queries";
import type {
  LanguageProjectItem,
  LanguageProjectScope,
} from "./types";

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

function revalidateLanguage(opts?: { docs?: boolean; docId?: string }) {
  revalidatePath("/language");
  if (opts?.docs) revalidatePath("/docs");
  if (opts?.docId) revalidatePath(`/docs/${opts.docId}`);
}

async function assertLangProjectMember(
  projectId: string,
  userId: string,
): Promise<boolean> {
  if (isUserAreaBucket(projectId, userId, "LANG")) return true;
  const row = await db.projectMember.findFirst({
    where: {
      projectId,
      userId,
      project: { area: "LANG", status: { not: "ARCHIVED" } },
    },
    select: { id: true },
  });
  return !!row;
}

export async function listLangProjectsAction(): Promise<LanguageProjectItem[]> {
  const session = await auth();
  if (!session?.user) return [];
  return listLangProjects(session.user.id);
}

export async function createLangProjectAction(input: {
  name: string;
  description?: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const name = input.name.trim();
  if (!name) return { success: false, error: "نام مسیر لازم است" };

  const project = await db.project.create({
    data: {
      name,
      description: input.description?.trim() || null,
      status: "ACTIVE",
      area: "LANG",
      members: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
    select: { id: true },
  });

  revalidateLanguage();
  return { success: true, data: { id: project.id } };
}

export async function logLangSessionAction(input: {
  skill: LangSkill;
  minutes: number;
  note?: string;
  projectId?: string | null;
  practicedAt?: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  if (!LANG_SKILLS.includes(input.skill)) {
    return { success: false, error: "مهارت نامعتبر است" };
  }

  const minutes = Math.round(Number(input.minutes));
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 24 * 60) {
    return { success: false, error: "مدت جلسه نامعتبر است" };
  }

  let projectId: string | null = null;
  if (input.projectId) {
    const ok = await assertLangProjectMember(
      input.projectId,
      session.user.id,
    );
    if (!ok) return { success: false, error: "مسیر زبان پیدا نشد" };
    projectId = isUserAreaBucket(input.projectId, session.user.id, "LANG")
      ? null
      : input.projectId;
  }

  const practicedAt = input.practicedAt
    ? new Date(input.practicedAt)
    : new Date();
  if (Number.isNaN(practicedAt.getTime())) {
    return { success: false, error: "تاریخ نامعتبر است" };
  }

  const row = await db.langSession.create({
    data: {
      userId: session.user.id,
      skill: input.skill,
      minutes,
      note: input.note?.trim() || null,
      projectId,
      practicedAt,
    },
    select: { id: true },
  });

  revalidateLanguage();
  return { success: true, data: { id: row.id } };
}

export async function updateLangProfileAction(input: {
  targetExam?: string | null;
  targetScore?: string | null;
  examDate?: string | null;
  weeklyGoalMin?: number;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const weeklyGoalMin =
    input.weeklyGoalMin !== undefined
      ? Math.round(Number(input.weeklyGoalMin))
      : undefined;
  if (
    weeklyGoalMin !== undefined &&
    (!Number.isFinite(weeklyGoalMin) ||
      weeklyGoalMin < 15 ||
      weeklyGoalMin > 7 * 24 * 60)
  ) {
    return { success: false, error: "هدف هفتگی نامعتبر است" };
  }

  let examDate: Date | null | undefined = undefined;
  if (input.examDate === null || input.examDate === "") {
    examDate = null;
  } else if (input.examDate) {
    const d = new Date(input.examDate);
    if (Number.isNaN(d.getTime())) {
      return { success: false, error: "تاریخ آزمون نامعتبر است" };
    }
    examDate = d;
  }

  await db.langProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      targetExam: input.targetExam?.trim() || "MSRT",
      targetScore: input.targetScore?.trim() || null,
      examDate: examDate ?? null,
      weeklyGoalMin: weeklyGoalMin ?? 210,
    },
    update: {
      ...(input.targetExam !== undefined
        ? { targetExam: input.targetExam?.trim() || null }
        : {}),
      ...(input.targetScore !== undefined
        ? { targetScore: input.targetScore?.trim() || null }
        : {}),
      ...(examDate !== undefined ? { examDate } : {}),
      ...(weeklyGoalMin !== undefined ? { weeklyGoalMin } : {}),
    },
  });

  // Keep newest matching exam tracks aligned with profile goals.
  if (
    input.targetExam !== undefined ||
    input.targetScore !== undefined ||
    examDate !== undefined
  ) {
    const kindRaw = (input.targetExam ?? "").trim().toUpperCase();
    if (
      ["MSRT", "IELTS", "TOEFL", "TOLIMO", "EPT", "CUSTOM"].includes(kindRaw)
    ) {
      await db.examTrack.updateMany({
        where: {
          userId: session.user.id,
          kind: kindRaw as ExamKindKey,
        },
        data: {
          ...(input.targetScore !== undefined
            ? { targetScore: input.targetScore?.trim() || null }
            : {}),
          ...(examDate !== undefined ? { examDate } : {}),
        },
      });
    }
  }

  revalidateLanguage();
  return { success: true };
}

export async function createLangDocAction(input?: {
  templateKey?: "langSession" | "langErrorLog" | "langEssay";
  title?: string;
  projectId?: string | null;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  let projectId: string | null | undefined = input?.projectId;
  if (projectId) {
    const ok = await assertLangProjectMember(projectId, session.user.id);
    if (!ok) return { success: false, error: "مسیر زبان پیدا نشد" };
    if (isUserAreaBucket(projectId, session.user.id, "LANG")) projectId = null;
  }

  const result = await createDoc({
    templateKey: input?.templateKey ?? "langSession",
    title: input?.title,
    area: "LANG",
    ...(projectId !== undefined ? { projectId } : {}),
  });

  if (result.success && result.data?.id) {
    revalidateLanguage({ docs: true, docId: result.data.id });
  }
  return result;
}

async function resolveLangProjectId(
  projectId: string | null | undefined,
  userId: string,
): Promise<{ ok: true; projectId: string | null | undefined } | { ok: false; error: string }> {
  if (projectId === undefined) return { ok: true, projectId: undefined };
  if (projectId === null || isUserAreaBucket(projectId, userId, "LANG")) {
    return { ok: true, projectId: null };
  }
  const ok = await assertLangProjectMember(projectId, userId);
  if (!ok) return { ok: false, error: "مسیر زبان پیدا نشد" };
  return { ok: true, projectId };
}

export async function createLangCardAction(input: {
  front: string;
  back: string;
  example?: string;
  tags?: string;
  deckKey?: string | null;
  lesson?: number | null;
  projectId?: string | null;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const front = input.front.trim();
  const back = input.back.trim();
  if (!front || !back) {
    return { success: false, error: "واژه و معنی لازم است" };
  }

  const resolved = await resolveLangProjectId(
    input.projectId,
    session.user.id,
  );
  if (!resolved.ok) return { success: false, error: resolved.error };

  const deckKey = input.deckKey?.trim() || null;
  const lesson =
    input.lesson != null && Number.isFinite(input.lesson) && input.lesson > 0
      ? Math.floor(input.lesson)
      : null;

  const card = await db.langCard.create({
    data: {
      userId: session.user.id,
      front,
      back,
      example: input.example?.trim() || null,
      tags:
        input.tags?.trim() ||
        (deckKey && lesson ? `deck:${deckKey} lesson:${lesson}` : null),
      deckKey,
      lesson,
      projectId:
        resolved.projectId === undefined ? null : resolved.projectId,
      box: 0,
      learningStep: 0,
      intervalDays: 0,
      nextReviewAt: new Date(),
    },
    select: { id: true },
  });

  revalidateLanguage();
  return { success: true, data: { id: card.id } };
}

export async function installVocabDeckAction(input: {
  deckKey: string;
  projectId?: string | null;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const deck = await loadVocabDeck(input.deckKey);
  if (!deck) return { success: false, error: "دک پیدا نشد" };

  const resolved = await resolveLangProjectId(
    input.projectId,
    session.user.id,
  );
  if (!resolved.ok) return { success: false, error: resolved.error };

  const existing = await db.langCard.findMany({
    where: {
      userId: session.user.id,
      deckKey: deck.key,
      projectId: resolved.projectId === undefined ? null : resolved.projectId,
    },
    select: { front: true, lesson: true },
  });
  const have = new Set(
    existing.map(c => `${(c.lesson ?? 0)}::${c.front.toLowerCase()}`),
  );

  const toCreate = deck.starter.filter(
    c => !have.has(`${c.lesson}::${c.front.toLowerCase()}`),
  );

  if (toCreate.length === 0) {
    return {
      success: true,
      data: { added: 0, total: existing.length },
    };
  }

  const data = toCreate.map(c => ({
    userId: session.user.id,
    front: c.front,
    back: c.back,
    example: c.example ?? null,
    tags: deckTag(deck.key, c.lesson),
    deckKey: deck.key,
    lesson: c.lesson,
    projectId:
      resolved.projectId === undefined ? null : resolved.projectId,
    box: 0,
    learningStep: 0,
    intervalDays: 0,
    nextReviewAt: new Date(),
  }));

  const chunk = 250;
  for (let i = 0; i < data.length; i += chunk) {
    await db.langCard.createMany({ data: data.slice(i, i + chunk) });
  }

  revalidateLanguage();
  return {
    success: true,
    data: {
      added: toCreate.length,
      total: existing.length + toCreate.length,
    },
  };
}

export async function importLessonCardsAction(input: {
  deckKey: string;
  lesson: number;
  /** lines: word | meaning  or  word — meaning */
  text: string;
  projectId?: string | null;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const deck = await loadVocabDeck(input.deckKey);
  if (!deck) return { success: false, error: "دک پیدا نشد" };
  if (
    !Number.isFinite(input.lesson) ||
    input.lesson < 1 ||
    input.lesson > deck.lessonCount
  ) {
    return { success: false, error: "شماره درس نامعتبر است" };
  }

  const resolved = await resolveLangProjectId(
    input.projectId,
    session.user.id,
  );
  if (!resolved.ok) return { success: false, error: resolved.error };

  const lines = input.text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const parsed: { front: string; back: string }[] = [];
  for (const line of lines) {
    const parts = line.split(/\s*[|—–\-]\s*/);
    if (parts.length < 2) continue;
    const front = parts[0]!.trim();
    const back = parts.slice(1).join(" - ").trim();
    if (front && back) parsed.push({ front, back });
  }

  if (parsed.length === 0) {
    return {
      success: false,
      error: "خطی با قالب «واژه | معنی» پیدا نشد",
    };
  }

  const existing = await db.langCard.findMany({
    where: {
      userId: session.user.id,
      deckKey: deck.key,
      lesson: input.lesson,
      projectId: resolved.projectId === undefined ? null : resolved.projectId,
    },
    select: { front: true },
  });
  const have = new Set(existing.map(c => c.front.toLowerCase()));
  const toCreate = parsed.filter(c => !have.has(c.front.toLowerCase()));

  if (toCreate.length > 0) {
    await db.langCard.createMany({
      data: toCreate.map(c => ({
        userId: session.user.id,
        front: c.front,
        back: c.back,
        tags: deckTag(deck.key, input.lesson),
        deckKey: deck.key,
        lesson: input.lesson,
        projectId:
          resolved.projectId === undefined ? null : resolved.projectId,
        box: 0,
        learningStep: 0,
        intervalDays: 0,
        nextReviewAt: new Date(),
      })),
    });
  }

  revalidateLanguage();
  return {
    success: true,
    data: {
      added: toCreate.length,
      skipped: parsed.length - toCreate.length,
    },
  };
}

export async function listDeckCardsAction(input: {
  deckKey: string;
  lesson?: number;
  projectId?: string | null;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const scope =
    input.projectId === undefined
      ? ("all" as const)
      : input.projectId === null
        ? ("inbox" as const)
        : input.projectId;

  const { listDeckCards } = await import("./queries");
  const cards = await listDeckCards(session.user.id, input.deckKey, {
    lesson: input.lesson,
    scope,
    take: 100,
  });

  return {
    success: true,
    data: {
      cards: cards.map(c => ({
        ...c,
        nextReviewAt: c.nextReviewAt.toISOString(),
        lastReviewedAt: c.lastReviewedAt?.toISOString() ?? null,
      })),
    },
  };
}

export async function listDueCardsAction(input?: {
  take?: number;
  projectId?: string | null;
  /** Focused weak-card queue (ignores due filter). */
  filter?: "all" | "hard";
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const scope =
    input?.projectId === undefined
      ? ("all" as const)
      : input.projectId === null
        ? ("inbox" as const)
        : input.projectId;

  const { listDueCards, listHardCards } = await import("./queries");
  const take = Math.min(80, Math.max(1, input?.take ?? 40));
  const cards =
    input?.filter === "hard"
      ? await listHardCards(session.user.id, { scope, take })
      : await listDueCards(session.user.id, { scope, take });

  return {
    success: true,
    data: {
      cards: cards.map(c => ({
        ...c,
        nextReviewAt: c.nextReviewAt.toISOString(),
        lastReviewedAt: c.lastReviewedAt?.toISOString() ?? null,
      })),
    },
  };
}

export async function reviewLangCardAction(input: {
  cardId: string;
  rating: VocabRating;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const ratings: VocabRating[] = ["again", "hard", "good", "easy"];
  if (!ratings.includes(input.rating)) {
    return { success: false, error: "امتیاز نامعتبر است" };
  }

  const card = await db.langCard.findFirst({
    where: { id: input.cardId, userId: session.user.id },
    select: {
      id: true,
      box: true,
      learningStep: true,
      reviewCount: true,
      lapses: true,
      projectId: true,
    },
  });
  if (!card) return { success: false, error: "کارت پیدا نشد" };

  const scheduled = scheduleAfterReview({
    box: card.box,
    learningStep: card.learningStep,
    rating: input.rating,
  });

  const now = new Date();
  const day = startOfAppDay(now);

  const todaySession = await db.langSession.findFirst({
    where: {
      userId: session.user.id,
      skill: "VOCAB",
      practicedAt: { gte: day },
      projectId: card.projectId,
    },
    orderBy: { practicedAt: "desc" },
    select: { id: true, minutes: true },
  });

  await db.$transaction([
    db.langCard.update({
      where: { id: card.id },
      data: {
        box: scheduled.box,
        learningStep: scheduled.learningStep,
        intervalDays: scheduled.intervalDays,
        nextReviewAt: scheduled.nextReviewAt,
        lastReviewedAt: now,
        reviewCount: card.reviewCount + 1,
        lapses: scheduled.lapsed ? card.lapses + 1 : card.lapses,
      },
    }),
    db.langVocabDay.upsert({
      where: {
        userId_day: { userId: session.user.id, day },
      },
      create: {
        userId: session.user.id,
        day,
        reviews: 1,
      },
      update: {
        reviews: { increment: 1 },
      },
    }),
    todaySession
      ? db.langSession.update({
          where: { id: todaySession.id },
          data: {
            minutes: todaySession.minutes + 1,
            note: "Vocab SRS",
          },
        })
      : db.langSession.create({
          data: {
            userId: session.user.id,
            skill: "VOCAB",
            minutes: 1,
            note: "Vocab SRS",
            projectId: card.projectId,
            practicedAt: now,
          },
        }),
  ]);

  revalidateLanguage();
  return {
    success: true,
    data: {
      nextReviewAt: scheduled.nextReviewAt.toISOString(),
      box: scheduled.box,
      learningStep: scheduled.learningStep,
      requeueInSession: scheduled.requeueInSession,
      graduated: scheduled.graduated,
    },
  };
}

export async function deleteLangCardAction(
  cardId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const card = await db.langCard.findFirst({
    where: { id: cardId, userId: session.user.id },
    select: { id: true },
  });
  if (!card) return { success: false, error: "کارت پیدا نشد" };

  await db.langCard.delete({ where: { id: card.id } });
  revalidateLanguage();
  return { success: true };
}

export async function createExamTrackAction(input: {
  kind: ExamKindKey;
  name?: string;
  targetScore?: string;
  examDate?: string | null;
  projectId?: string | null;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const template = getExamTemplate(input.kind);
  const name =
    (input.name ?? "").trim() ||
    template.nameFa;

  const resolved = await resolveLangProjectId(
    input.projectId,
    session.user.id,
  );
  if (!resolved.ok) return { success: false, error: resolved.error };

  let examDate: Date | null = null;
  if (input.examDate) {
    const d = new Date(input.examDate);
    if (Number.isNaN(d.getTime())) {
      return { success: false, error: "تاریخ آزمون نامعتبر است" };
    }
    examDate = d;
  }

  const track = await db.examTrack.create({
    data: {
      userId: session.user.id,
      kind: input.kind,
      name,
      targetScore:
        input.targetScore?.trim() || template.defaultTarget,
      examDate,
      projectId:
        resolved.projectId === undefined ? null : resolved.projectId,
    },
    select: { id: true },
  });

  revalidateLanguage();
  return { success: true, data: { id: track.id } };
}

export async function ensureDefaultExamTrackAction(input?: {
  projectId?: string | null;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const profile = await db.langProfile.findUnique({
    where: { userId: session.user.id },
    select: { targetExam: true, targetScore: true, examDate: true },
  });

  const kindRaw = (profile?.targetExam ?? "MSRT").toUpperCase();
  const kind = (
    ["MSRT", "IELTS", "TOEFL", "TOLIMO", "EPT", "CUSTOM"].includes(kindRaw)
      ? kindRaw
      : "MSRT"
  ) as ExamKindKey;

  let projectFilter: string | null | undefined = undefined;
  if (input?.projectId !== undefined) {
    const resolved = await resolveLangProjectId(
      input.projectId,
      session.user.id,
    );
    if (!resolved.ok) return { success: false, error: resolved.error };
    projectFilter =
      resolved.projectId === undefined ? null : resolved.projectId;
  }

  const existing = await db.examTrack.findFirst({
    where: {
      userId: session.user.id,
      kind,
      ...(projectFilter !== undefined ? { projectId: projectFilter } : {}),
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  if (existing) return { success: true, data: { id: existing.id } };

  return createExamTrackAction({
    kind,
    targetScore: profile?.targetScore ?? undefined,
    examDate: profile?.examDate?.toISOString() ?? null,
    projectId: input?.projectId,
  });
}

export async function saveMockAttemptAction(input: {
  trackId: string;
  sections: MockSectionResult[];
  note?: string;
  durationSec?: number;
  projectId?: string | null;
  attemptId?: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const track = await db.examTrack.findFirst({
    where: { id: input.trackId, userId: session.user.id },
    select: { id: true, kind: true, projectId: true },
  });
  if (!track) return { success: false, error: "مسیر آزمون پیدا نشد" };

  if (!Array.isArray(input.sections) || input.sections.length === 0) {
    return { success: false, error: "نتیجه بخش‌ها لازم است" };
  }

  const scored = scoreMockSections(input.sections);
  const startedAt = new Date(
    Date.now() - Math.max(0, (input.durationSec ?? 0) * 1000),
  );
  const finishedAt = new Date();

  let projectId = track.projectId;
  if (input.projectId !== undefined) {
    const resolved = await resolveLangProjectId(
      input.projectId,
      session.user.id,
    );
    if (!resolved.ok) return { success: false, error: resolved.error };
    projectId =
      resolved.projectId === undefined ? null : resolved.projectId;
  }

  const payload = {
    status: "COMPLETED" as const,
    startedAt,
    finishedAt,
    durationSec: input.durationSec ?? null,
    totalCorrect: scored.totalCorrect,
    totalQuestions: scored.totalQuestions,
    percent: scored.percent,
    sections: input.sections as unknown as Prisma.InputJsonValue,
    note: input.note?.trim() || null,
  };

  let mock: { id: string; percent: number | null };
  if (input.attemptId) {
    const existing = await db.mockAttempt.findFirst({
      where: {
        id: input.attemptId,
        userId: session.user.id,
        trackId: track.id,
        status: "IN_PROGRESS",
      },
      select: { id: true },
    });
    if (!existing) return { success: false, error: "آزمون در جریان پیدا نشد" };
    mock = await db.mockAttempt.update({
      where: { id: existing.id },
      data: payload,
      select: { id: true, percent: true },
    });
  } else {
    mock = await db.mockAttempt.create({
      data: {
        userId: session.user.id,
        trackId: track.id,
        projectId,
        kind: track.kind,
        ...payload,
      },
      select: { id: true, percent: true },
    });
  }

  await db.examTrack.update({
    where: { id: track.id },
    data: { updatedAt: new Date() },
  });

  const minutes = Math.max(
    1,
    Math.round((input.durationSec ?? scored.totalQuestions * 60) / 60),
  );
  const skill = (scored.weakestSkill ?? "READING") as LangSkill;
  await db.langSession.create({
    data: {
      userId: session.user.id,
      skill,
      minutes,
      note: `Mock ${track.kind} · bank-score ${scored.percent}%`,
      projectId,
      practicedAt: finishedAt,
    },
  });

  revalidateLanguage();
  return {
    success: true,
    data: {
      id: mock.id,
      percent: mock.percent,
      weakestSkill: scored.weakestSkill,
      selfScore: true,
    },
  };
}

export async function startMockAttemptAction(input: {
  trackId: string;
  projectId?: string | null;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const track = await db.examTrack.findFirst({
    where: { id: input.trackId, userId: session.user.id },
    select: { id: true, kind: true, projectId: true },
  });
  if (!track) return { success: false, error: "مسیر آزمون پیدا نشد" };

  let projectId = track.projectId;
  if (input.projectId !== undefined) {
    const resolved = await resolveLangProjectId(
      input.projectId,
      session.user.id,
    );
    if (!resolved.ok) return { success: false, error: resolved.error };
    projectId =
      resolved.projectId === undefined ? null : resolved.projectId;
  }

  const mock = await db.mockAttempt.create({
    data: {
      userId: session.user.id,
      trackId: track.id,
      projectId,
      kind: track.kind,
      status: "IN_PROGRESS",
      startedAt: new Date(),
      sections: [],
    },
    select: { id: true },
  });

  revalidateLanguage();
  return { success: true, data: { id: mock.id } };
}

export async function abandonMockAttemptAction(
  attemptId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const mock = await db.mockAttempt.findFirst({
    where: {
      id: attemptId,
      userId: session.user.id,
      status: "IN_PROGRESS",
    },
    select: { id: true },
  });
  if (!mock) return { success: false, error: "آزمون در جریان پیدا نشد" };

  await db.mockAttempt.update({
    where: { id: mock.id },
    data: {
      status: "ABANDONED",
      finishedAt: new Date(),
    },
  });

  revalidateLanguage();
  return { success: true };
}

export async function deleteExamTrackAction(
  trackId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const track = await db.examTrack.findFirst({
    where: { id: trackId, userId: session.user.id },
    select: { id: true },
  });
  if (!track) return { success: false, error: "مسیر آزمون پیدا نشد" };

  await db.examTrack.delete({ where: { id: track.id } });
  revalidateLanguage();
  return { success: true };
}

export async function createListeningClipAction(input: {
  title: string;
  url: string;
  level?: string;
  transcript?: string;
  notes?: string;
  projectId?: string | null;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const title = input.title.trim();
  if (!title) return { success: false, error: "عنوان لازم است" };

  const parsed = parseListeningSource(input.url);
  if (!parsed.ok) return { success: false, error: parsed.error };

  let projectId: string | null = null;
  if (input.projectId) {
    const ok = await assertLangProjectMember(
      input.projectId,
      session.user.id,
    );
    if (!ok) return { success: false, error: "مسیر زبان پیدا نشد" };
    projectId = isUserAreaBucket(input.projectId, session.user.id, "LANG")
      ? null
      : input.projectId;
  }

  const row = await db.langListeningClip.create({
    data: {
      userId: session.user.id,
      projectId,
      title,
      sourceType: parsed.sourceType,
      sourceRef: parsed.sourceRef,
      level: input.level?.trim() || null,
      transcript: input.transcript?.trim() || null,
      notes: input.notes?.trim() || null,
    },
    select: { id: true },
  });

  revalidateLanguage();
  return { success: true, data: { id: row.id } };
}

export async function installListeningStartersAction(input?: {
  projectId?: string | null;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  let projectId: string | null = null;
  if (input?.projectId) {
    const ok = await assertLangProjectMember(
      input.projectId,
      session.user.id,
    );
    if (!ok) return { success: false, error: "مسیر زبان پیدا نشد" };
    projectId = isUserAreaBucket(input.projectId, session.user.id, "LANG")
      ? null
      : input.projectId;
  }

  const existing = await db.langListeningClip.findMany({
    where: {
      userId: session.user.id,
      starterKey: { in: LISTENING_STARTERS.map(s => s.key) },
      projectId,
    },
    select: { starterKey: true },
  });
  const have = new Set(existing.map(e => e.starterKey).filter(Boolean));
  const toAdd = LISTENING_STARTERS.filter(s => !have.has(s.key));
  if (toAdd.length === 0) {
    return { success: true, data: { added: 0 } };
  }

  await db.langListeningClip.createMany({
    data: toAdd.map(s => ({
      userId: session.user.id,
      projectId,
      title: s.title,
      sourceType: "YOUTUBE" as const,
      sourceRef: s.youtubeId,
      level: s.level,
      transcript: s.transcript,
      notes: `${s.topic} · ${s.hint}`,
      starterKey: s.key,
    })),
  });

  revalidateLanguage();
  return { success: true, data: { added: toAdd.length } };
}

export async function markListeningPlayedAction(
  clipId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const clip = await db.langListeningClip.findFirst({
    where: { id: clipId, userId: session.user.id },
    select: { id: true },
  });
  if (!clip) return { success: false, error: "کلیپ پیدا نشد" };

  await db.langListeningClip.update({
    where: { id: clip.id },
    data: {
      lastPlayedAt: new Date(),
    },
  });

  revalidateLanguage();
  return { success: true };
}

export async function completeListeningSessionAction(input: {
  clipId: string;
  minutes: number;
  note?: string;
  dictationScore?: number;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const clip = await db.langListeningClip.findFirst({
    where: { id: input.clipId, userId: session.user.id },
    select: { id: true, title: true, projectId: true, playCount: true },
  });
  if (!clip) return { success: false, error: "کلیپ پیدا نشد" };

  const minutes = Math.max(1, Math.round(Number(input.minutes)));
  if (!Number.isFinite(minutes) || minutes > 24 * 60) {
    return { success: false, error: "مدت جلسه نامعتبر است" };
  }

  const scorePart =
    typeof input.dictationScore === "number" &&
    Number.isFinite(input.dictationScore)
      ? ` · dictation ${Math.round(input.dictationScore)}%`
      : "";
  const noteBase = input.note?.trim() || `Listening: ${clip.title}`;
  const note = `${noteBase}${scorePart}`.slice(0, 2000);

  await db.$transaction([
    db.langSession.create({
      data: {
        userId: session.user.id,
        skill: "LISTENING",
        minutes,
        note,
        projectId: clip.projectId,
        practicedAt: new Date(),
      },
    }),
    db.langListeningClip.update({
      where: { id: clip.id },
      data: {
        lastPlayedAt: new Date(),
        playCount: clip.playCount + 1,
      },
    }),
  ]);

  revalidateLanguage();
  return { success: true, data: { minutes } };
}

export async function deleteListeningClipAction(
  clipId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const clip = await db.langListeningClip.findFirst({
    where: { id: clipId, userId: session.user.id },
    select: { id: true },
  });
  if (!clip) return { success: false, error: "کلیپ پیدا نشد" };

  await db.langListeningClip.delete({ where: { id: clip.id } });
  revalidateLanguage();
  return { success: true };
}

export { parseLanguageProjectScope };
