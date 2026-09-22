import { GENERATED_BANKS } from "./banks/generated";
import { toLessons, type VocabDeckDef } from "./types";
import { VOCAB_DECK_504 } from "./essential-504";

const PER = 12;

function deckFromBank(
  key: string,
  category: VocabDeckDef["category"],
  banks: Array<Array<{ front: string; back: string }>>,
): VocabDeckDef {
  const words = banks.flat();
  const starter = toLessons(words, PER);
  const lessonCount = Math.max(1, Math.ceil(words.length / PER));
  return {
    key,
    category,
    wordsPerLesson: PER,
    lessonCount,
    starter,
  };
}

export const VOCAB_DECK_LEVELS: VocabDeckDef = deckFromBank(
  "levels",
  "general",
  [
    GENERATED_BANKS.general_a2 ?? [],
    GENERATED_BANKS.general_b1 ?? [],
    GENERATED_BANKS.general_b2 ?? [],
  ],
);

export const VOCAB_DECK_ACADEMIC: VocabDeckDef = deckFromBank(
  "academic",
  "general",
  [GENERATED_BANKS.academic ?? []],
);

export const VOCAB_DECK_BUSINESS: VocabDeckDef = deckFromBank(
  "business",
  "general",
  [GENERATED_BANKS.business ?? []],
);

export const VOCAB_DECK_SCIENCE: VocabDeckDef = deckFromBank(
  "science",
  "general",
  [GENERATED_BANKS.science ?? []],
);

export const VOCAB_DECK_DAILY: VocabDeckDef = deckFromBank(
  "daily",
  "general",
  [GENERATED_BANKS.daily ?? []],
);

export const VOCAB_DECK_CS: VocabDeckDef = deckFromBank("cs", "tech", [
  GENERATED_BANKS.cs ?? [],
]);

export const VOCAB_DECK_AI: VocabDeckDef = deckFromBank("ai", "tech", [
  GENERATED_BANKS.ai ?? [],
]);

export const MEGA_DECK_LIST: VocabDeckDef[] = [
  VOCAB_DECK_LEVELS,
  VOCAB_DECK_ACADEMIC,
  VOCAB_DECK_BUSINESS,
  VOCAB_DECK_SCIENCE,
  VOCAB_DECK_DAILY,
  VOCAB_DECK_CS,
  VOCAB_DECK_AI,
  VOCAB_DECK_504,
];

export function countMegaWords(): number {
  return MEGA_DECK_LIST.filter(d => d.key !== "504").reduce(
    (n, d) => n + d.starter.length,
    0,
  );
}
