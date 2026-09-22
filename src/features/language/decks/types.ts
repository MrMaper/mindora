export interface VocabDeckCardSeed {
  front: string;
  back: string;
  example?: string;
  lesson: number;
}

export interface VocabDeckDef {
  key: string;
  lessonCount: number;
  wordsPerLesson: number;
  /** general | tech | track */
  category: "general" | "tech" | "track";
  starter: VocabDeckCardSeed[];
}

export function deckTag(deckKey: string, lesson: number): string {
  return `deck:${deckKey} lesson:${lesson}`;
}

/** Chunk a flat word list into numbered lessons. */
export function toLessons(
  words: Array<{ front: string; back: string; example?: string }>,
  perLesson: number,
): VocabDeckCardSeed[] {
  return words.map((w, i) => ({
    ...w,
    lesson: Math.floor(i / perLesson) + 1,
  }));
}
