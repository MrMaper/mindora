/** Normalize typed answers for EN/FA comparison. */
export function normalizeAnswer(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\u200c/g, "") // ZWNJ
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[’'`]/g, "'")
    .replace(/\s+/g, " ");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = new Array<number>(b.length + 1);
  const cur = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(
        (prev[j] ?? 0) + 1,
        (cur[j - 1] ?? 0) + 1,
        (prev[j - 1] ?? 0) + cost,
      );
    }
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j] ?? 0;
  }
  return prev[b.length] ?? b.length;
}

export type TypedGrade = "exact" | "close" | "wrong";

/** Split gloss alternatives: "a / b" or "الف، ب". */
function alternatives(expected: string): string[] {
  return expected
    .split(/[/|؛;،,]+/)
    .map(normalizeAnswer)
    .filter(Boolean);
}

export function gradeTypedAnswer(
  input: string,
  expected: string,
): TypedGrade {
  const a = normalizeAnswer(input);
  if (!a) return "wrong";

  const alts = alternatives(expected);
  const primary = normalizeAnswer(expected);
  const targets = alts.length > 0 ? alts : primary ? [primary] : [];

  for (const t of targets) {
    if (a === t) return "exact";
  }
  for (const t of targets) {
    if (t.includes(a) || a.includes(t)) {
      if (Math.min(a.length, t.length) >= 3) return "close";
    }
    const maxDist = Math.max(1, Math.floor(t.length * 0.25));
    if (levenshtein(a, t) <= maxDist) return "close";
  }
  return "wrong";
}

export function gradeToRating(
  grade: TypedGrade,
): "good" | "hard" | "again" {
  if (grade === "exact") return "good";
  if (grade === "close") return "hard";
  return "again";
}
