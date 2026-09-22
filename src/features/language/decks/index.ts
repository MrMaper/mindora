import type { VocabDeckDef } from "./types";
import { MEGA_DECK_LIST } from "./mega-decks";

export type { VocabDeckCardSeed, VocabDeckDef } from "./types";
export { deckTag, toLessons } from "./types";
export { countMegaWords } from "./mega-decks";

export const VOCAB_DECK_LIST: VocabDeckDef[] = MEGA_DECK_LIST;

export const VOCAB_DECKS: Record<string, VocabDeckDef> = Object.fromEntries(
  VOCAB_DECK_LIST.map(d => [d.key, d]),
);

export function getVocabDeck(key: string): VocabDeckDef | null {
  return VOCAB_DECKS[key] ?? null;
}
