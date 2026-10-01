import { VOCAB_DECK_KEYS } from "../src/features/language/decks/catalog-meta";
import { loadVocabDeck } from "../src/features/language/decks/mega-decks";

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

async function main() {
  const byDeck = new Map<
    string,
    {
      total: number;
      unique: number;
      dups: [string, number][];
      fronts: string[];
    }
  >();

  for (const key of VOCAB_DECK_KEYS) {
    const deck = await loadVocabDeck(key);
    if (!deck) {
      console.log("MISSING", key);
      continue;
    }
    const fronts = deck.starter.map(c => norm(c.front));
    const counts = new Map<string, number>();
    for (const f of fronts) counts.set(f, (counts.get(f) || 0) + 1);
    const dups = [...counts.entries()]
      .filter(([, n]) => n > 1)
      .sort((a, b) => b[1] - a[1]) as [string, number][];
    byDeck.set(key, {
      total: fronts.length,
      unique: counts.size,
      dups,
      fronts: [...new Set(fronts)],
    });
    console.log(
      `--- ${key}: total=${fronts.length} unique=${counts.size} dupTypes=${dups.length}`,
    );
    if (dups.length) {
      console.log(
        "  WITHIN:",
        dups
          .slice(0, 40)
          .map(([f, n]) => `${f}×${n}`)
          .join(" | "),
      );
    }
  }

  const owners = new Map<string, string[]>();
  for (const [key, info] of byDeck) {
    for (const f of info.fronts) {
      const list = owners.get(f) ?? [];
      list.push(key);
      owners.set(f, list);
    }
  }
  const cross = [...owners.entries()].filter(([, ds]) => ds.length > 1);
  console.log(`\nCROSS-DECK overlapping words: ${cross.length}`);
  const pair = new Map<string, number>();
  for (const [, ds] of cross) {
    for (let i = 0; i < ds.length; i++) {
      for (let j = i + 1; j < ds.length; j++) {
        const k = `${ds[i]}∩${ds[j]}`;
        pair.set(k, (pair.get(k) || 0) + 1);
      }
    }
  }
  console.log(
    [...pair.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k}: ${n}`)
      .join("\n"),
  );
  console.log("\nAll cross:");
  for (const [f, ds] of cross.sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`  ${f} -> ${ds.join(",")}`);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
