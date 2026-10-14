/**
 * Files that still hardcode area literals (UI label chains, visual maps).
 * P5 (dynamic UI) removes them; only ever shrink this list. See docs/AREAS.md §13.
 */
export default [
  "src/app/(dashboard)/calendar/calendar-cc.tsx",
  "src/app/(dashboard)/calendar/week-hour-grid.tsx",
  "src/app/(dashboard)/docs/docs-cc.tsx",
  "src/app/(dashboard)/projects/components/ui/area-section.tsx",
  "src/app/(dashboard)/tasks/components/ui/tasks-table.tsx",
  "src/components/docs/doc-taxonomy-drawer.tsx",
  "src/components/docs/task-linked-docs.tsx",
  "src/components/docs/write-today-block.tsx",
  "src/components/life/capture-dialog.tsx",
  "src/components/life/focus-session.tsx",
  "src/components/life/habits-panel.tsx",
  "src/components/life/today-focus-slots.tsx",
  "src/components/tasks/task-form-fields.tsx",
  "src/lib/area-visual.ts",
];
