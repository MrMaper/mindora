import { prisma as db } from "@/lib/db";
import { areaBucketIdsToExclude } from "@/lib/life";
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
import { REVIEW_QUEUE_TAKE, sortDueForReview } from "./srs";
import {
  scoreMockSections,
  type ExamKindKey,
  type MockSectionResult,
} from "./exam-templates";
import { VOCAB_DECK_KEYS, VOCAB_DECK_META } from "./decks/catalog-meta";
import type { LanguageTab } from "./types";
import { daysAgoApp, startOfAppDay, startOfAppDayInstant } from "./day";

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
        id: { notIn: areaBucketIdsToExclude(userId, "LANG") },
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
  // Allow yesterday start if nothing today yet.
  if (!days.has(cursor.getTime())) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  while (days.has(cursor.getTime())) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
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
    take: 2000,
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
  opts?: { tab?: LanguageTab },
): Promise<LanguageHubData> {
  const tab = opts?.tab ?? "today";
  const needVocab = tab === "today" || tab === "vocab" || tab === "skills";
  const needListening = tab === "today" || tab === "listening";
  const needExams = tab === "today" || tab === "exams";
  const needNotes = tab === "today" || tab === "notes";
  const needSkills = tab === "today" || tab === "skills";

  const pf = projectFilter(scope);
  const weekStart = daysAgo(6);
  const now = new Date();
  const todayStart = startOfLocalDay();
  const todayInstant = startOfAppDayInstant(now);
  const cardWhere = {
    userId,
    ...(pf.projectId !== undefined ? { projectId: pf.projectId } : {}),
  };

  if (needVocab) await ensureVocabDayBackfill(userId);

  const emptyLessons = (lessonCount: number): VocabLessonProgress[] =>
    Array.from({ length: lessonCount }, (_, i) => ({
      lesson: i + 1,
      total: 0,
      due: 0,
      fresh: 0,
    }));

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
    deckStats,
    lessonStats,
    lessonDueStats,
    lessonFreshStats,
    listeningClips,
    examTrackRows,
    recentMockRows,
  ] = await Promise.all([
    ensureLangProfile(userId),
    listLangProjects(userId),
    needSkills
      ? db.langSession.findMany({
          where: {
            userId,
            ...(pf.projectId !== undefined ? { projectId: pf.projectId } : {}),
          },
          orderBy: { practicedAt: "desc" },
          take: 80,
          select: {
            id: true,
            skill: true,
            minutes: true,
            note: true,
            practicedAt: true,
            projectId: true,
            project: { select: { name: true } },
          },
        })
      : Promise.resolve(
          [] as {
            id: string;
            skill: LangSkill;
            minutes: number;
            note: string | null;
            practicedAt: Date;
            projectId: string | null;
            project: { name: string } | null;
          }[],
        ),
    db.langSession.aggregate({
      where: {
        userId,
        practicedAt: { gte: weekStart },
        ...(pf.projectId !== undefined ? { projectId: pf.projectId } : {}),
      },
      _sum: { minutes: true },
    }),
    needNotes
      ? db.doc.findMany({
          where: {
            userId,
            deletedAt: null,
            archived: false,
            area: "LANG",
            ...(pf.projectId !== undefined
              ? pf.projectId === null
                ? { projectId: null }
                : { projectId: pf.projectId }
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
        })
      : Promise.resolve([]),
    needVocab
      ? db.langCard.count({
          where: {
            ...cardWhere,
            reviewCount: { gt: 0 },
            nextReviewAt: { lte: now },
          },
        })
      : Promise.resolve(0),
    needVocab ? db.langCard.count({ where: cardWhere }) : Promise.resolve(0),
    needVocab
      ? db.langCard.count({ where: { ...cardWhere, reviewCount: 0 } })
      : Promise.resolve(0),
    needVocab
      ? db.langCard.count({
          where: { ...cardWhere, lastReviewedAt: { gte: todayInstant } },
        })
      : Promise.resolve(0),
    needVocab
      ? db.langCard.findMany({
          where: {
            ...cardWhere,
            reviewCount: { gt: 0 },
            nextReviewAt: { lte: now },
          },
          orderBy: [{ nextReviewAt: "asc" }, { createdAt: "asc" }],
          take: Math.max(REVIEW_QUEUE_TAKE * 3, 60),
          select: cardSelect,
        })
      : Promise.resolve([]),
    needVocab
      ? db.langCard.findMany({
          where: cardWhere,
          orderBy: { updatedAt: "desc" },
          take: 12,
          select: cardSelect,
        })
      : Promise.resolve([]),
    needVocab
      ? db.langCard.findMany({
          where: { ...cardWhere, ...hardCardWhere() },
          orderBy: [{ lapses: "desc" }, { box: "asc" }, { updatedAt: "desc" }],
          take: REVIEW_QUEUE_TAKE,
          select: cardSelect,
        })
      : Promise.resolve([]),
    needVocab
      ? db.langVocabDay.findMany({
          where: { userId, day: { gte: daysAgo(120) } },
          select: { day: true, reviews: true },
          orderBy: { day: "desc" },
          take: 200,
        })
      : Promise.resolve([]),
    needVocab
      ? db.langCard.groupBy({
          by: ["deckKey"],
          where: { ...cardWhere, deckKey: { in: [...VOCAB_DECK_KEYS] } },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    needVocab
      ? db.langCard.groupBy({
          by: ["deckKey", "lesson"],
          where: {
            ...cardWhere,
            deckKey: { in: [...VOCAB_DECK_KEYS] },
            lesson: { not: null },
          },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    needVocab
      ? db.langCard.groupBy({
          by: ["deckKey", "lesson"],
          where: {
            ...cardWhere,
            deckKey: { in: [...VOCAB_DECK_KEYS] },
            lesson: { not: null },
            reviewCount: { gt: 0 },
            nextReviewAt: { lte: now },
          },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    needVocab
      ? db.langCard.groupBy({
          by: ["deckKey", "lesson"],
          where: {
            ...cardWhere,
            deckKey: { in: [...VOCAB_DECK_KEYS] },
            lesson: { not: null },
            reviewCount: 0,
          },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    needListening
      ? db.langListeningClip.findMany({
          where: {
            userId,
            ...(pf.projectId !== undefined ? { projectId: pf.projectId } : {}),
          },
          orderBy: [{ lastPlayedAt: "desc" }, { updatedAt: "desc" }],
          take: 40,
          select: listeningClipSelect,
        })
      : Promise.resolve([]),
    needExams
      ? db.examTrack.findMany({
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
        })
      : Promise.resolve([]),
    needExams
      ? db.mockAttempt.findMany({
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
        })
      : Promise.resolve([]),
  ]);

  const stats = needSkills
    ? await skillStatsFromDb(userId, scope)
    : LANG_SKILLS.map(skill => ({
        skill,
        minutes7d: 0,
        minutesTotal: 0,
        sessionCount: 0,
      }));

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

  const dueByDeckLesson = new Map<string, number>();
  for (const row of lessonDueStats) {
    if (!row.deckKey || row.lesson == null) continue;
    dueByDeckLesson.set(`${row.deckKey}:${row.lesson}`, row._count._all);
  }
  const totalByDeckLesson = new Map<string, number>();
  for (const row of lessonStats) {
    if (!row.deckKey || row.lesson == null) continue;
    totalByDeckLesson.set(`${row.deckKey}:${row.lesson}`, row._count._all);
  }
  const freshByDeckLesson = new Map<string, number>();
  for (const row of lessonFreshStats) {
    if (!row.deckKey || row.lesson == null) continue;
    freshByDeckLesson.set(`${row.deckKey}:${row.lesson}`, row._count._all);
  }
  const installedByDeck = new Map(
    deckStats
      .filter(r => r.deckKey)
      .map(r => [r.deckKey as string, r._count._all]),
  );

  const vocabDecks: VocabDeckProgress[] = VOCAB_DECK_META.map(deck => {
    const installed = installedByDeck.get(deck.key) ?? 0;
    const lessons = emptyLessons(deck.lessonCount);
    let due = 0;
    for (const slot of lessons) {
      const key = `${deck.key}:${slot.lesson}`;
      const total = totalByDeckLesson.get(key) ?? 0;
      const lessonDue = dueByDeckLesson.get(key) ?? 0;
      slot.total = total;
      slot.due = lessonDue;
      slot.fresh = freshByDeckLesson.get(key) ?? 0;
      due += lessonDue;
    }
    return {
      key: deck.key,
      installed,
      due,
      seen: 0,
      learning: 0,
      mastered: 0,
      fresh: 0,
      lessonCount: deck.lessonCount,
      wordsPerLesson: deck.wordsPerLesson,
      starterCount: deck.starterCount,
      lessons,
    };
  });

  if (needVocab && installedByDeck.size > 0) {
    const [freshRows, learningRows, masteredRows] = await Promise.all([
      db.langCard.groupBy({
        by: ["deckKey"],
        where: {
          ...cardWhere,
          deckKey: { in: [...VOCAB_DECK_KEYS] },
          reviewCount: 0,
        },
        _count: { _all: true },
      }),
      db.langCard.groupBy({
        by: ["deckKey"],
        where: {
          ...cardWhere,
          deckKey: { in: [...VOCAB_DECK_KEYS] },
          learningStep: { not: null },
          reviewCount: { gt: 0 },
        },
        _count: { _all: true },
      }),
      db.langCard.groupBy({
        by: ["deckKey"],
        where: {
          ...cardWhere,
          deckKey: { in: [...VOCAB_DECK_KEYS] },
          learningStep: null,
          box: { gte: 3 },
        },
        _count: { _all: true },
      }),
    ]);
    const freshMap = new Map(
      freshRows
        .filter(r => r.deckKey)
        .map(r => [r.deckKey as string, r._count._all]),
    );
    const learningMap = new Map(
      learningRows
        .filter(r => r.deckKey)
        .map(r => [r.deckKey as string, r._count._all]),
    );
    const masteredMap = new Map(
      masteredRows
        .filter(r => r.deckKey)
        .map(r => [r.deckKey as string, r._count._all]),
    );
    for (const deck of vocabDecks) {
      deck.fresh = freshMap.get(deck.key) ?? 0;
      deck.learning = learningMap.get(deck.key) ?? 0;
      deck.mastered = masteredMap.get(deck.key) ?? 0;
      deck.seen = Math.max(0, deck.installed - deck.fresh);
    }
  }

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

  const sessionItems: LangSessionItem[] = sessions.map(s => ({
    id: s.id,
    skill: s.skill as LangSkill,
    minutes: s.minutes,
    note: s.note,
    practicedAt: s.practicedAt,
    projectId: s.projectId,
    projectName: s.project?.name ?? null,
  }));

  return {
    profile,
    projects,
    sessions: sessionItems.slice(0, 12),
    skillStats: stats,
    weekMinutes: weekAgg._sum.minutes ?? 0,
    streakDays: computeStreak(sessionItems),
    suggestSkill: suggestSkill(stats),
    recentDocs: docs.map(d => ({
      id: d.id,
      title: d.title,
      updatedAt: d.updatedAt,
      wordCount: countWords(d.contentText),
    })),
    vocab,
    dueCards: sortDueForReview(dueCards.map(mapCard)).slice(
      0,
      REVIEW_QUEUE_TAKE,
    ),
    recentCards: recentCards.map(mapCard),
    hardCards: hardCards.map(mapCard),
    vocabDecks,
    listeningClips: listeningClips.map(mapListeningClip),
    examTracks,
    recentMocks: recentMockRows.map(mapMock),
  };
}


export async function listDueCards(
  userId: string,
  opts?: {
    scope?: LanguageProjectScope;
    take?: number;
  },
): Promise<LangCardItem[]> {
  const pf = projectFilter(opts?.scope ?? "all");
  const now = new Date();
  const take = opts?.take ?? REVIEW_QUEUE_TAKE;
  const rows = await db.langCard.findMany({
    where: {
      userId,
      // Review = already studied at least once. Brand-new installs stay in Study.
      reviewCount: { gt: 0 },
      nextReviewAt: { lte: now },
      ...(pf.projectId !== undefined ? { projectId: pf.projectId } : {}),
    },
    orderBy: [{ nextReviewAt: "asc" }, { createdAt: "asc" }],
    // Over-fetch so learning cards are not starved by older graduated dues.
    take: Math.max(take * 3, 60),
    select: cardSelect,
  });
  return sortDueForReview(rows.map(mapCard)).slice(0, take);
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
      reviewCount: { gt: 0 },
      ...hardCardWhere(),
      ...(pf.projectId !== undefined ? { projectId: pf.projectId } : {}),
    },
    orderBy: [{ lapses: "desc" }, { box: "asc" }, { nextReviewAt: "asc" }],
    take: opts?.take ?? REVIEW_QUEUE_TAKE,
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
