/** Tiny helper so outline UI need not import the TipTap editor module. */
export function scrollDocEditorToHeading(index: number) {
  const nodes = document.querySelectorAll(
    ".doc-editor h1, .doc-editor h2, .doc-editor h3",
  );
  const el = nodes[index] as HTMLElement | undefined;
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}
