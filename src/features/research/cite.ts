/** Simple APA-like citation string (not full CSL). */
export function formatApaLike(input: {
  title: string;
  authors?: string | null;
  year?: string | null;
  url?: string | null;
  doi?: string | null;
}): string {
  const authors = (input.authors || "").trim() || "Unknown";
  const year = (input.year || "").trim() || "n.d.";
  const title = input.title.trim() || "Untitled";
  const doi = (input.doi || "").trim();
  const url = (input.url || "").trim();
  const locator = doi
    ? `https://doi.org/${doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")}`
    : url;
  return `${authors} (${year}). ${title}.${locator ? ` ${locator}` : ""}`;
}

export function toBibTeX(input: {
  id: string;
  title: string;
  authors?: string | null;
  year?: string | null;
  url?: string | null;
  doi?: string | null;
  notes?: string | null;
}): string {
  const key =
    slugKey(input.authors, input.year, input.title) || `src${input.id.slice(0, 8)}`;
  const fields: string[] = [`  title = {${escapeBib(input.title)}}`];
  if (input.authors?.trim()) {
    fields.push(`  author = {${escapeBib(input.authors.trim())}}`);
  }
  if (input.year?.trim()) {
    fields.push(`  year = {${escapeBib(input.year.trim())}}`);
  }
  if (input.doi?.trim()) {
    fields.push(
      `  doi = {${escapeBib(input.doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, ""))}}`,
    );
  }
  if (input.url?.trim()) {
    fields.push(`  url = {${escapeBib(input.url.trim())}}`);
  }
  if (input.notes?.trim()) {
    fields.push(`  note = {${escapeBib(input.notes.trim())}}`);
  }
  return `@article{${key},\n${fields.join(",\n")}\n}`;
}

export function sourcesToBibTeX(
  sources: {
    id: string;
    title: string;
    authors?: string | null;
    year?: string | null;
    url?: string | null;
    doi?: string | null;
    notes?: string | null;
  }[],
): string {
  return sources.map(toBibTeX).join("\n\n");
}

function escapeBib(s: string): string {
  return s.replace(/[{}]/g, "");
}

function slugKey(
  authors: string | null | undefined,
  year: string | null | undefined,
  title: string,
): string {
  const authorPart = (authors || "")
    .split(/[,&;]/)[0]
    ?.trim()
    .split(/\s+/)
    .pop()
    ?.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "");
  const yearPart = (year || "").replace(/[^0-9]/g, "").slice(0, 4);
  const titlePart = title
    .trim()
    .split(/\s+/)[0]
    ?.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "")
    .slice(0, 12);
  const key = [authorPart, yearPart, titlePart].filter(Boolean).join("");
  return key || "";
}

export function normalizeDoi(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "");
}
