export interface OutlineHeading {
  id: string;
  level: 1 | 2 | 3;
  text: string;
}

export function countWords(text: string): number {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return 0;
  // Supports Persian/English tokens
  return cleaned.split(/\s+/).filter(Boolean).length;
}

export function parseOutlineFromHtml(html: string): OutlineHeading[] {
  const headings: OutlineHeading[] = [];
  const re = /<h([1-3])([^>]*)>([\s\S]*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = re.exec(html)) !== null) {
    const level = Number(match[1]) as 1 | 2 | 3;
    const attrs = match[2] ?? "";
    const idMatch = attrs.match(/id=["']([^"']+)["']/i);
    const text = match[3]
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
    if (!text) continue;
    headings.push({
      id: idMatch?.[1] ?? `heading-${index}`,
      level,
      text,
    });
    index += 1;
  }
  return headings;
}

/** Ensure each h1–h3 has a stable id for outline navigation. */
export function ensureHeadingIds(html: string): string {
  let i = 0;
  return html.replace(/<h([1-3])([^>]*)>/gi, (full, level, attrs) => {
    if (/id=["']/i.test(attrs)) return full;
    const id = `h-${level}-${i++}`;
    return `<h${level}${attrs} id="${id}">`;
  });
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export type DiffPart = { type: "equal" | "add" | "del"; text: string };

/** Word-level diff (Persian/English). Left = old/base, right = new. */
export function diffWords(left: string, right: string): DiffPart[] {
  const a = left.trim() ? left.trim().split(/\s+/) : [];
  const b = right.trim() ? right.trim().split(/\s+/) : [];
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array<number>(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const parts: DiffPart[] = [];
  let i = 0;
  let j = 0;
  const push = (type: DiffPart["type"], text: string) => {
    const last = parts[parts.length - 1];
    if (last && last.type === type) last.text += ` ${text}`;
    else parts.push({ type, text });
  };
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push("equal", a[i]);
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push("del", a[i]);
      i += 1;
    } else {
      push("add", b[j]);
      j += 1;
    }
  }
  while (i < n) {
    push("del", a[i]);
    i += 1;
  }
  while (j < m) {
    push("add", b[j]);
    j += 1;
  }
  return parts;
}

