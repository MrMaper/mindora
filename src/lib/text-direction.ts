/** True when Latin (or other LTR) letters dominate RTL scripts — for mixed UI chrome. */
export function prefersLtrText(text: string | null | undefined): boolean {
  if (!text) return false;
  const sample = text.slice(0, 240);
  const latin = (sample.match(/[A-Za-z\u00C0-\u024F]/g) ?? []).length;
  const rtl =
    (sample.match(/[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) ??
      []).length;
  if (latin === 0 && rtl === 0) return false;
  return latin >= rtl;
}
