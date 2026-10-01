import type { LangSkill } from "@/types/db";
import type { VocabRating } from "./srs";
import type { ExamKindKey, MockSectionResult } from "./exam-templates";

export type LanguageTab =
  | "today"
  | "skills"
  | "vocab"
  | "listening"
  | "exams"
  | "notes";

export type LanguageProjectScope = "all" | "inbox" | string;

export type { VocabRating, ExamKindKey, MockSectionResult };

export interface LanguageProjectItem {
  id: string;
  name: string;
  description: string | null;
}

export interface LangSessionItem {
  id: string;
  skill: LangSkill;
  minutes: number;
  note: string | null;
  practicedAt: Date;
  projectId: string | null;
  projectName: string | null;
}

export interface LangProfileItem {
  targetExam: string | null;
  targetScore: string | null;
  examDate: Date | null;
  weeklyGoalMin: number;
}

export interface LangSkillStat {
  skill: LangSkill;
  minutes7d: number;
  minutesTotal: number;
  sessionCount: number;
}

export interface LangCardItem {
  id: string;
  front: string;
  back: string;
  example: string | null;
  tags: string | null;
  deckKey: string | null;
  lesson: number | null;
  box: number;
  /** null = graduated; 0..n = learning. */
  learningStep: number | null;
  intervalDays: number;
  nextReviewAt: Date;
  lastReviewedAt: Date | null;
  reviewCount: number;
  lapses: number;
  projectId: string | null;
  projectName: string | null;
}

export interface LangVocabStats {
  dueCount: number;
  totalCount: number;
  newCount: number;
  /** Distinct cards rated today (Study or Review). */
  reviewedToday: number;
  /** Total rating events today (incl. requeues). */
  reviewsToday: number;
  /** Consecutive Tehran days with at least one vocab rating. */
  streakDays: number;
}

export interface VocabLessonProgress {
  lesson: number;
  total: number;
  due: number;
  /** reviewCount === 0 in this lesson */
  fresh: number;
}

export interface VocabDeckProgress {
  key: string;
  installed: number;
  due: number;
  /** reviewCount > 0 — touched at least once. */
  seen: number;
  /** Still in learning steps. */
  learning: number;
  /** Graduated with box ≥ 3 (7d+). */
  mastered: number;
  /** reviewCount === 0 */
  fresh: number;
  lessonCount: number;
  wordsPerLesson: number;
  starterCount: number;
  lessons: VocabLessonProgress[];
}

export interface ExamTrackItem {
  id: string;
  kind: ExamKindKey;
  name: string;
  targetScore: string | null;
  examDate: Date | null;
  projectId: string | null;
  projectName: string | null;
  mockCount: number;
  lastPercent: number | null;
  lastMockAt: Date | null;
}

export interface MockAttemptItem {
  id: string;
  trackId: string;
  trackName: string;
  kind: ExamKindKey;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  startedAt: Date;
  finishedAt: Date | null;
  durationSec: number | null;
  totalCorrect: number | null;
  totalQuestions: number | null;
  percent: number | null;
  sections: MockSectionResult[];
  note: string | null;
  weakestSkill: LangSkill | null;
}

export type ListeningSourceType = "YOUTUBE" | "AUDIO";

export interface LangListeningClipItem {
  id: string;
  title: string;
  sourceType: ListeningSourceType;
  sourceRef: string;
  level: string | null;
  transcript: string | null;
  notes: string | null;
  starterKey: string | null;
  lastPlayedAt: Date | null;
  playCount: number;
  projectId: string | null;
  projectName: string | null;
  updatedAt: Date;
}

export interface LanguageHubData {
  profile: LangProfileItem;
  sessions: LangSessionItem[];
  skillStats: LangSkillStat[];
  weekMinutes: number;
  streakDays: number;
  suggestSkill: LangSkill;
  projects: LanguageProjectItem[];
  recentDocs: {
    id: string;
    title: string;
    updatedAt: Date;
    wordCount: number;
  }[];
  vocab: LangVocabStats;
  dueCards: LangCardItem[];
  recentCards: LangCardItem[];
  /** High-lapse / reset cards for focused practice. */
  hardCards: LangCardItem[];
  vocabDecks: VocabDeckProgress[];
  listeningClips: LangListeningClipItem[];
  examTracks: ExamTrackItem[];
  recentMocks: MockAttemptItem[];
}

export const LANG_SKILLS: LangSkill[] = [
  "LISTENING",
  "READING",
  "WRITING",
  "SPEAKING",
  "GRAMMAR",
  "VOCAB",
  "PRONUNCIATION",
];
