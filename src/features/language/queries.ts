import { prisma as db } from "@/lib/db";
import { AREA_PROJECT_IDS } from "@/lib/life";
import { countWords } from "@/features/docs/utils";
import type { LangSkill } from "@/types/db";
import {
  LANG_SKILLS,
  type ExamTrackItem,
  type LanguageHubData,
  type LanguageProjectItem,
  type LanguageProjectScope,
  type LangCardItem,
  type LangListeningClipItem,
  type LangProfileItem,
  type LangSessionItem,
  type LangSkillStat,
  type LangVocabStats,
  type MockAttemptItem,
  type VocabDeckProgress,
  type VocabLessonProgress,
} from "./types";
import {
  scoreMockSections,
  type ExamKindKey,
  type MockSectionResult,
} from "./exam-templates";
import { VOCAB_DECK_LIST } from "./decks";
import { daysAgoApp, startOfAppDay } from "./day";

function startOfLocalDay(d = new Date()): Date {
  return startOfAppDay(d);
}

function daysAgo(n: number): Date {
  return daysAgoApp(n);
}

function projectFilter(scope: LanguageProjectScope): {
  projectId?: string | null;
} {
  if (scope === "all") return {};
  if (scope === "inbox") return { projectId: null };
  return { projectId: scope };
}

export function parseLanguageProjectScope(
  raw: string | undefined | null,
): LanguageProjectScope {
  if (!raw || raw === "all") return "all";
  if (raw === "inbox") return "inbox";
  return raw;
}

export async function listLangProjects(
  userId: string,
): Promise<LanguageProjectItem[]> {
  const rows = await db.projectMember.findMany({
    where: {
      userId,
      project: {
        area: "LANG",
        status: { not: "ARCHIVED" },
        id: { not: AREA_PROJECT_IDS.LANG },
      },
    },
    orderBy: { project: { updatedAt: "desc" } },
    select: {
      project: { select: { id: true, name: true, description: true } },
    },
  });
  return rows.map(r => r.project);
}

export async function ensureLangProfile(
  userId: string,
): Promise<LangProfileItem> {
  const existing = await db.langProfile.findUnique({
    where: { userId },
    select: {
      targetExam: true,
      targetScore: true,
      examDate: true,
      weeklyGoalMin: true,
    },
  });
  if (existing) return existing;
  return db.langProfile.create({
    data: { userId, weeklyGoalMin: 210, targetExam: "MSRT" },
    select: {
      targetExam: true,
      targetScore: true,
      examDate: true,
      weeklyGoalMin: true,
    },
  });
}

async function getSessions(
  userId: string,
  scope: LanguageProjectScope,
  take = 40,
): Promise<LangSessionItem[]> {
  const pf = projectFilter(scope);
  const rows = await db.langSession.findMany({
    where: {
      userId,
      ...(pf.projectId !== undefined
        ? { projectId: pf.projectId }
        : {}),
    },
    orderBy: { practicedAt: "desc" },
    take,
    select: {
      id: true,
      skill: true,
      minutes: true,
      note: true,
      practicedAt: true,
      projectId: true,
      project: { select: { name: true } },
    },
  });
  return rows.map(r => ({
    id: r.id,
    skill: r.skill,
    minutes: r.minutes,
    note: r.note,
    practicedAt: r.practicedAt,
    projectId: r.projectId,
    projectName: r.project?.name ?? null,
  }));
}

function computeStreak(sessions: LangSessionItem[]): number {
  return computeDayStreak(sessions.map(s => s.practicedAt));
}

function computeDayStreak(dates: Date[]): number {
  const days = new Set(dates.map(d => startOfLocalDay(d).getTime()));
  let streak = 0;
  const cursor = startOfLocalDay();
  // allow yesterday start if nothing today yet
  if (!days.has(cursor.getTime())) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(cursor.getTime())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** One-time seed of vocab days from card lastReviewedAt (lossy history). */
async function ensureVocabDayBackfill(userId: string): Promise<void> {
  const existing = await db.langVocabDay.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (existing) return;

  const cards = await db.langCard.findMany({
    where: { userId, lastReviewedAt: { not: null } },
    select: { lastReviewedAt: true },
    take: 5000,
  });
  if (cards.length === 0) return;

  const byDay = new Map<number, number>();
  for (const c of cards) {
    if (!c.lastReviewedAt) continue;
    const t = startOfLocalDay(c.lastReviewedAt).getTime();
    byDay.set(t, (byDay.get(t) ?? 0) + 1);
  }

  await db.langVocabDay.createMany({
    data: Array.from(byDay.entries()).map(([t, reviews]) => ({
      userId,
      day: new Date(t),
      reviews,
    })),
    skipDuplicates: true,
  });
}

async function skillStatsFromDb(
  userId: string,
  scope: LanguageProjectScope,
): Promise<LangSkillStat[]> {
  const pf = projectFilter(scope);
  const whereBase = {
    userId,
    ...(pf.projectId !== undefined ? { projectId: pf.projectId } : {}),
  };
  const weekStart = daysAgo(6);

  const [allTime, week] = await Promise.all([
    db.langSession.groupBy({
      by: ["skill"],
      where: whereBase,
      _sum: { minutes: true },
      _count: { _all: true },
    }),
    db.langSession.groupBy({
      by: ["skill"],
      where: {
        ...whereBase,
        practicedAt: { gte: weekStart },
      },
      _sum: { minutes: true },
    }),
  ]);

  const weekMap = new Map(
    week.map(r => [r.skill as LangSkill, r._sum.minutes ?? 0]),
  );
  const allMap = new Map(
    allTime.map(r => [
      r.skill as LangSkill,
      {
        minutesTotal: r._sum.minutes ?? 0,
        sessionCount: r._count._all,
      },
    ]),
  );

  return LANG_SKILLS.map(skill => ({
    skill,
    minutes7d: weekMap.get(skill) ?? 0,
    minutesTotal: allMap.get(skill)?.minutesTotal ?? 0,
    sessionCount: allMap.get(skill)?.sessionCount ?? 0,
  }));
}

function suggestSkill(stats: LangSkillStat[]): LangSkill {
  const sorted = [...stats].sort((a, b) => a.minutes7d - b.minutes7d);
  return sorted[0]?.skill ?? "VOCAB";
}

function mapCard(r: {
  id: string;
  front: string;
  back: string;
  example: string | null;
  tags: string | null;
  deckKey: string | null;
  lesson: number | null;
  box: number;
  learningStep: number | null;
  intervalDays: number;
  nextReviewAt: Date;
  lastReviewedAt: Date | null;
  reviewCount: number;
  lapses: number;
  projectId: string | null;
  project: { name: string } | null;
}): LangCardItem {
  return {
    id: r.id,
    front: r.front,
    back: r.back,
    example: r.example,
    tags: r.tags,
    deckKey: r.deckKey,
    lesson: r.lesson,
    box: r.box,
    learningStep: r.learningStep,
    intervalDays: r.intervalDays,
    nextReviewAt: r.nextReviewAt,
    lastReviewedAt: r.lastReviewedAt,
    reviewCount: r.reviewCount,
    lapses: r.lapses,
    projectId: r.projectId,
    projectName: r.project?.name ?? null,
  };
}

const listeningClipSelect = {
  id: true,
  title: true,
  sourceType: true,
  sourceRef: true,
  level: true,
  transcript: true,
  notes: true,
  starterKey: true,
  lastPlayedAt: true,
  playCount: true,
  projectId: true,
  updatedAt: true,
  project: { select: { name: true } },
} as const;

function mapListeningClip(r: {
  id: string;
  title: string;
  sourceType: "YOUTUBE" | "AUDIO";
  sourceRef: string;
  level: string | null;
  transcript: string | null;
  notes: string | null;
  starterKey: string | null;
  lastPlayedAt: Date | null;
  playCount: number;
  projectId: string | null;
  updatedAt: Date;
  project: { name: string } | null;
}): LangListeningClipItem {
  return {
    id: r.id,
    title: r.title,
    sourceType: r.sourceType,
    sourceRef: r.sourceRef,
    level: r.level,
    transcript: r.transcript,
    notes: r.notes,
    starterKey: r.starterKey,
    lastPlayedAt: r.lastPlayedAt,
    playCount: r.playCount,
    projectId: r.projectId,
    projectName: r.project?.name ?? null,
    updatedAt: r.updatedAt,
  };
}

const cardSelect = {
  id: true,
  front: true,
  back: true,
  example: true,
  tags: true,
  deckKey: true,
  lesson: true,
  box: true,
  learningStep: true,
  intervalDays: true,
  nextReviewAt: true,
  lastReviewedAt: true,
  reviewCount: true,
  lapses: true,
  projectId: true,
  project: { select: { name: true } },
} as const;

/** Shared “weak / hard” predicate for stats + focused review. */
export function hardCardWhere() {
  return {
    OR: [
      { lapses: { gte: 2 } },
      {
        AND: [
          { lapses: { gte: 1 } },
          {
            OR: [{ learningStep: { not: null } }, { box: { lte: 1 } }],
          },
        ],
      },
    ],
  };
}

function parseSections(raw: unknown): MockSectionResult[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (s): s is MockSectionResult =>
      !!s &&
      typeof s === "object" &&
      typeof (s as MockSectionResult).key === "string",
  );
}

function mapMock(r: {
  id: string;
  trackId: string;
  kind: string;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  durationSec: number | null;
  totalCorrect: number | null;
  totalQuestions: number | null;
  percent: number | null;
  sections: unknown;
  note: string | null;
  track: { name: string };
}): MockAttemptItem {
  const sections = parseSections(r.sections);
  const scored = scoreMockSections(sections);
  return {
    id: r.id,
    trackId: r.trackId,
    trackName: r.track.name,
    kind: r.kind as ExamKindKey,
    status: r.status as MockAttemptItem["status"],
    startedAt: r.startedAt,
    finishedAt: r.finishedAt,
    durationSec: r.durationSec,
    totalCorrect: r.totalCorrect,
    totalQuestions: r.totalQuestions,
    percent: r.percent,
    sections,
    note: r.note,
    weakestSkill: scored.weakestSkill,
  };
}

export async function getLanguageHubData(
  userId: string,
  scope: LanguageProjectScope = "all",
): Promise<LanguageHubData> {
  const pf = projectFilter(scope);
  const weekStart = daysAgo(6);
  const now = new Date();
  const todayStart = startOfLocalDay();
  const cardWhere = {
    userId,
    ...(pf.projectId !== undefined ? { projectId: pf.projectId } : {}),
  };

  await ensureVocabDayBackfill(userId);

  const [
    profile,
    projects,
    sessions,
    weekAgg,
    docs,
    dueCount,
    totalCount,
    newCount,
    reviewedToday,
    dueCards,
    recentCards,
    hardCards,
    vocabDayRows,
    catalogDeckRows,
    listeningClips,
    examTrackRows,
    recentMockRows,
  ] = await Promise.all([
    ensureLangProfile(userId),
    listLangProjects(userId),
    getSessions(userId, scope, 200),
    db.langSession.aggregate({
      where: {
        userId,
        practicedAt: { gte: weekStart },
        ...(pf.projectId !== undefined ? { projectId: pf.projectId } : {}),
      },
      _sum: { minutes: true },
    }),
    db.doc.findMany({
      where: {
        userId,
        area: "LANG",
        deletedAt: null,
        archived: false,
        ...(pf.projectId === null
          ? { projectId: null }
          : pf.projectId
            ? { projectId: pf.projectId }
            : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        contentText: true,
      },
    }),
    db.langCard.count({
      where: { ...cardWhere, nextReviewAt: { lte: now } },
    }),
    db.langCard.count({ where: cardWhere }),
    db.langCard.count({ where: { ...cardWhere, reviewCount: 0 } }),
    db.langCard.count({
      where: {
        ...cardWhere,
        lastReviewedAt: { gte: todayStart },
      },
    }),
    db.langCard.findMany({
      where: { ...cardWhere, nextReviewAt: { lte: now } },
      orderBy: [{ nextReviewAt: "asc" }, { createdAt: "asc" }],
      take: 40,
      select: cardSelect,
    }),
    db.langCard.findMany({
      where: cardWhere,
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: cardSelect,
    }),
    db.langCard.findMany({
      where: {
        ...cardWhere,
        ...hardCardWhere(),
      },
      orderBy: [{ lapses: "desc" }, { box: "asc" }, { updatedAt: "desc" }],
      take: 20,
      select: cardSelect,
    }),
    db.langVocabDay.findMany({
      where: {
        userId,
        day: { gte: daysAgo(120) },
      },
      select: { day: true, reviews: true },
      orderBy: { day: "desc" },
      take: 200,
    }),
    db.langCard.findMany({
      where: {
        ...cardWhere,
        deckKey: { in: VOCAB_DECK_LIST.map(d => d.key) },
      },
      select: {
        deckKey: true,
        lesson: true,
        nextReviewAt: true,
        box: true,
        reviewCount: true,
        learningStep: true,
      },
      take: 5000,
    }),
    db.langListeningClip.findMany({
      where: {
        userId,
        ...(pf.projectId !== undefined ? { projectId: pf.projectId } : {}),
      },
      orderBy: [{ lastPlayedAt: "desc" }, { updatedAt: "desc" }],
      take: 80,
      select: listeningClipSelect,
    }),
    db.examTrack.findMany({
      where: {
        userId,
        ...(pf.projectId !== undefined ? { projectId: pf.projectId } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        kind: true,
        name: true,
        targetScore: true,
        examDate: true,
        projectId: true,
        project: { select: { name: true } },
        mocks: {
          where: { status: "COMPLETED" },
          orderBy: { finishedAt: "desc" },
          take: 1,
          select: { percent: true, finishedAt: true },
        },
        _count: { select: { mocks: true } },
      },
    }),
    db.mockAttempt.findMany({
      where: {
        userId,
        status: "COMPLETED",
        ...(pf.projectId !== undefined ? { projectId: pf.projectId } : {}),
      },
      orderBy: { finishedAt: "desc" },
      take: 8,
      select: {
        id: true,
        trackId: true,
        kind: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        durationSec: true,
        totalCorrect: true,
        totalQuestions: true,
        percent: true,
        sections: true,
        note: true,
        track: { select: { name: true } },
      },
    }),
  ]);

  const stats = await skillStatsFromDb(userId, scope);
  const vocabStreak = computeDayStreak(vocabDayRows.map(r => r.day));
  const todayKey = todayStart.getTime();
  const reviewsToday =
    vocabDayRows.find(r => startOfLocalDay(r.day).getTime() === todayKey)
      ?.reviews ?? 0;
  const vocab: LangVocabStats = {
    dueCount,
    totalCount,
    newCount,
    reviewedToday,
    reviewsToday,
    streakDays: vocabStreak,
  };

  const vocabDecks: VocabDeckProgress[] = VOCAB_DECK_LIST.map(deck => {
    const lessonMap = new Map<number, VocabLessonProgress>();
    for (let i = 1; i <= deck.lessonCount; i++) {
      lessonMap.set(i, { lesson: i, total: 0, due: 0 });
    }
    let due = 0;
    let installed = 0;
    let seen = 0;
    let learning = 0;
    let mastered = 0;
    let fresh = 0;
    for (const row of catalogDeckRows) {
      if (row.deckKey !== deck.key) continue;
      installed += 1;
      if (row.reviewCount === 0) fresh += 1;
      else seen += 1;
      if (row.learningStep != null) {
        if (row.reviewCount > 0) learning += 1;
      } else if (row.box >= 3) {
        mastered += 1;
      }
      const lesson = row.lesson ?? 0;
      if (lesson < 1) continue;
      const slot = lessonMap.get(lesson) ?? { lesson, total: 0, due: 0 };
      slot.total += 1;
      if (row.nextReviewAt.getTime() <= now.getTime()) {
        slot.due += 1;
        due += 1;
      }
      lessonMap.set(lesson, slot);
    }
    return {
      key: deck.key,
      installed,
      due,
      seen,
      learning,
      mastered,
      fresh,
      lessonCount: deck.lessonCount,
      wordsPerLesson: deck.wordsPerLesson,
      starterCount: deck.starter.length,
      lessons: Array.from(lessonMap.values()),
    };
  });

  const examTracks: ExamTrackItem[] = examTrackRows.map(t => ({
    id: t.id,
    kind: t.kind as ExamKindKey,
    name: t.name,
    targetScore: t.targetScore,
    examDate: t.examDate,
    projectId: t.projectId,
    projectName: t.project?.name ?? null,
    mockCount: t._count.mocks,
    lastPercent: t.mocks[0]?.percent ?? null,
    lastMockAt: t.mocks[0]?.finishedAt ?? null,
  }));

  return {
    profile,
    projects,
    sessions: sessions.slice(0, 12),
    skillStats: stats,
    weekMinutes: weekAgg._sum.minutes ?? 0,
    streakDays: computeStreak(sessions),
    suggestSkill: suggestSkill(stats),
    recentDocs: docs.map(d => ({
      id: d.id,
      title: d.title,
      updatedAt: d.updatedAt,
      wordCount: countWords(d.contentText),
    })),
    vocab,
    dueCards: dueCards.map(mapCard),
    recentCards: recentCards.map(mapCard),
    hardCards: hardCards.map(mapCard),
    vocabDecks,
    listeningClips: listeningClips.map(mapListeningClip),
    examTracks,
    recentMocks: recentMockRows.map(mapMock),
  };
}

/** Due cards for review queue / refill. */
export async function listDueCards(
  userId: string,
  opts?: {
    scope?: LanguageProjectScope;
    take?: number;
  },
): Promise<LangCardItem[]> {
  const pf = projectFilter(opts?.scope ?? "all");
  const now = new Date();
  const rows = await db.langCard.findMany({
    where: {
      userId,
      nextReviewAt: { lte: now },
      ...(pf.projectId !== undefined ? { projectId: pf.projectId } : {}),
    },
    orderBy: [{ nextReviewAt: "asc" }, { createdAt: "asc" }],
    take: opts?.take ?? 40,
    select: cardSelect,
  });
  return rows.map(mapCard);
}

/** Hard / weak cards for focused review (not limited to due). */
export async function listHardCards(
  userId: string,
  opts?: {
    scope?: LanguageProjectScope;
    take?: number;
  },
): Promise<LangCardItem[]> {
  const pf = projectFilter(opts?.scope ?? "all");
  const rows = await db.langCard.findMany({
    where: {
      userId,
      ...hardCardWhere(),
      ...(pf.projectId !== undefined ? { projectId: pf.projectId } : {}),
    },
    orderBy: [{ lapses: "desc" }, { box: "asc" }, { nextReviewAt: "asc" }],
    take: opts?.take ?? 40,
    select: cardSelect,
  });
  return rows.map(mapCard);
}

/** Cards for a deck (optional lesson filter). */
export async function listDeckCards(
  userId: string,
  deckKey: string,
  opts?: {
    lesson?: number;
    scope?: LanguageProjectScope;
    take?: number;
  },
): Promise<LangCardItem[]> {
  const pf = projectFilter(opts?.scope ?? "all");
  const rows = await db.langCard.findMany({
    where: {
      userId,
      deckKey,
      ...(opts?.lesson != null ? { lesson: opts.lesson } : {}),
      ...(pf.projectId !== undefined ? { projectId: pf.projectId } : {}),
    },
    orderBy: [{ lesson: "asc" }, { front: "asc" }],
    take: opts?.take ?? 200,
    select: cardSelect,
  });
  return rows.map(mapCard);
}
