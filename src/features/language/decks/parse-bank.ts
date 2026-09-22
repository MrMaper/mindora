/** Parse compact "word|meaning" lines into card seeds. */
export function parseWordBank(
  raw: string,
): Array<{ front: string; back: string }> {
  const seen = new Set<string>();
  const out: Array<{ front: string; back: string }> = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const pipe = trimmed.indexOf("|");
    if (pipe <= 0) continue;
    const front = trimmed.slice(0, pipe).trim();
    const back = trimmed.slice(pipe + 1).trim();
    if (!front || !back) continue;
    const key = front.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ front, back });
  }
  return out;
}
