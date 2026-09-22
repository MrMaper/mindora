/** Extract checkbox / bullet lines that can become tasks. */
export function extractTaskCandidatesFromHtml(html: string): string[] {
  const titles: string[] = [];
  const taskItemRe =
    /<li[^>]*data-type="taskItem"[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match: RegExpExecArray | null;
  while ((match = taskItemRe.exec(html)) !== null) {
    const text = match[1]
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
    if (text) titles.push(text);
  }

  if (titles.length === 0) {
    const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    while ((match = liRe.exec(html)) !== null) {
      if (/data-type="taskItem"/i.test(match[0])) continue;
      const text = match[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim();
      if (text) titles.push(text);
    }
  }

  const seen = new Set<string>();
  return titles
    .map(t => t.replace(/\s+/g, " ").trim().slice(0, 160))
    .filter(t => {
      const key = t.toLowerCase();
      if (!t || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
