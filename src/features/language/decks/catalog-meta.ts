/** Lightweight deck catalog — no word banks. Used by hub progress UI. */
export const VOCAB_DECK_META = [
  {
    key: "levels",
    category: "general" as const,
    lessonCount: 65,
    wordsPerLesson: 12,
    starterCount: 779,
  },
  {
    key: "academic",
    category: "general" as const,
    lessonCount: 40,
    wordsPerLesson: 12,
    starterCount: 477,
  },
  {
    key: "business",
    category: "general" as const,
    lessonCount: 17,
    wordsPerLesson: 12,
    starterCount: 198,
  },
  {
    key: "science",
    category: "general" as const,
    lessonCount: 17,
    wordsPerLesson: 12,
    starterCount: 199,
  },
  {
    key: "daily",
    category: "general" as const,
    lessonCount: 18,
    wordsPerLesson: 12,
    starterCount: 212,
  },
  {
    key: "cs",
    category: "tech" as const,
    lessonCount: 16,
    wordsPerLesson: 12,
    starterCount: 185,
  },
  {
    key: "ai",
    category: "tech" as const,
    lessonCount: 13,
    wordsPerLesson: 12,
    starterCount: 154,
  },
  {
    key: "health",
    category: "general" as const,
    lessonCount: 9,
    wordsPerLesson: 12,
    starterCount: 100,
  },
  {
    key: "law",
    category: "general" as const,
    lessonCount: 9,
    wordsPerLesson: 12,
    starterCount: 99,
  },
  {
    key: "media",
    category: "general" as const,
    lessonCount: 9,
    wordsPerLesson: 12,
    starterCount: 107,
  },
  {
    key: "psychology",
    category: "general" as const,
    lessonCount: 9,
    wordsPerLesson: 12,
    starterCount: 100,
  },
  {
    key: "phrasal",
    category: "general" as const,
    lessonCount: 10,
    wordsPerLesson: 12,
    starterCount: 116,
  },
  {
    key: "environment",
    category: "general" as const,
    lessonCount: 10,
    wordsPerLesson: 12,
    starterCount: 113,
  },
  {
    key: "504",
    category: "track" as const,
    lessonCount: 3,
    wordsPerLesson: 12,
    starterCount: 29,
  },
] as const;

export type VocabDeckMeta = (typeof VOCAB_DECK_META)[number];

export const VOCAB_DECK_KEYS = VOCAB_DECK_META.map(d => d.key);
