import { toLessons, type VocabDeckDef } from "./types";
import { loadBank } from "./banks/load-bank";
import { VOCAB_DECK_META } from "./catalog-meta";

const PER = 12;

const DECK_BANKS: Record<string, string[]> = {
  levels: ["general_a2", "general_b1", "general_b2"],
  academic: ["academic"],
  business: ["business"],
  science: ["science"],
  daily: ["daily"],
  cs: ["cs"],
  ai: ["ai"],
};

async function deckFromBanks(
  key: string,
  category: VocabDeckDef["category"],
  bankKeys: string[],
): Promise<VocabDeckDef> {
  const banks = await Promise.all(bankKeys.map(k => loadBank(k)));
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

/** Load a single deck — pulls only that deck's bank chunks. */
export async function loadVocabDeck(key: string): Promise<VocabDeckDef | null> {
  if (key === "504") {
    const { VOCAB_DECK_504 } = await import("./essential-504");
    return VOCAB_DECK_504;
  }
  const bankKeys = DECK_BANKS[key];
  if (!bankKeys) return null;
  const meta = VOCAB_DECK_META.find(d => d.key === key);
  const category = meta?.category ?? "general";
  return deckFromBanks(key, category, bankKeys);
}

export function countMegaWords(): number {
  return VOCAB_DECK_META.filter(d => d.key !== "504").reduce(
    (n, d) => n + d.starterCount,
    0,
  );
}
