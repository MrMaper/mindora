import type { IconName } from "@/components/ui-kit/foundation/icon";
import type { AreaPrefRow } from "@/features/projects/types";
import type { AreaRef, HubKind } from "@/lib/areas";

/**
 * Shared area identity for hub, calendar, tasks, etc.
 * research purple · work orange · life blue · language green
 * (palette keyed by hubFor / templateKey; everything else uses the life palette)
 */
export type AreaVisual = {
  emoji: string;
  icon: IconName;
  /** Tailwind classes for solid chips (calendar blocks, badges). */
  chip: string;
  /** Soft wash backgrounds. */
  wash: string;
  /** Text / icon tint. */
  text: string;
  /** Thin top accent on cards. */
  borderTop: string;
  /** Dot marker. */
  dot: string;
  /** CSS color for inline styles when needed. */
  cssVar: string;
};

export type AreaVisualKey = "research" | "work" | "life" | "language";

export const AREA_VISUAL: Record<AreaVisualKey, AreaVisual> = {
  research: {
    emoji: "🎓",
    icon: "file-text",
    chip: "bg-[var(--status-review)] text-white",
    wash: "bg-[color-mix(in_srgb,var(--status-review)_10%,transparent)]",
    text: "text-[var(--status-review)]",
    borderTop: "border-t-[3px] border-t-[var(--status-review)]",
    dot: "bg-[var(--status-review)]",
    cssVar: "var(--status-review)",
  },
  work: {
    emoji: "💼",
    icon: "columns",
    chip: "bg-[var(--status-in-progress)] text-white",
    wash: "bg-[color-mix(in_srgb,var(--status-in-progress)_10%,transparent)]",
    text: "text-[var(--status-in-progress)]",
    borderTop: "border-t-[3px] border-t-[var(--status-in-progress)]",
    dot: "bg-[var(--status-in-progress)]",
    cssVar: "var(--status-in-progress)",
  },
  life: {
    emoji: "🏠",
    icon: "home",
    chip: "bg-[var(--status-todo)] text-white",
    wash: "bg-[color-mix(in_srgb,var(--status-todo)_10%,transparent)]",
    text: "text-[var(--status-todo)]",
    borderTop: "border-t-[3px] border-t-[var(--status-todo)]",
    dot: "bg-[var(--status-todo)]",
    cssVar: "var(--status-todo)",
  },
  language: {
    emoji: "🗣️",
    icon: "language",
    chip: "bg-emerald-600 text-white",
    wash: "bg-emerald-600/10",
    text: "text-emerald-700 dark:text-emerald-400",
    borderTop: "border-t-[3px] border-t-emerald-600",
    dot: "bg-emerald-600",
    cssVar: "#059669",
  },
};

/** Preset color keys users can pick for an area. */
export const AREA_COLOR_PRESETS: {
  key: string;
  labelFa: string;
  labelEn: string;
  cssVar: string;
}[] = [
  { key: "review", labelFa: "بنفش", labelEn: "Purple", cssVar: "var(--status-review)" },
  { key: "orange", labelFa: "نارنجی", labelEn: "Orange", cssVar: "var(--status-in-progress)" },
  { key: "blue", labelFa: "آبی", labelEn: "Blue", cssVar: "var(--status-todo)" },
  { key: "emerald", labelFa: "سبز", labelEn: "Green", cssVar: "#059669" },
  { key: "rose", labelFa: "صورتی", labelEn: "Rose", cssVar: "#e11d48" },
  { key: "amber", labelFa: "کهربایی", labelEn: "Amber", cssVar: "#d97706" },
  { key: "cyan", labelFa: "فیروزه‌ای", labelEn: "Cyan", cssVar: "#0891b2" },
  { key: "slate", labelFa: "خاکستری", labelEn: "Slate", cssVar: "#64748b" },
];

export const AREA_ICON_PRESETS: { key: string; emoji: string }[] = [
  { key: "🎓", emoji: "🎓" },
  { key: "💼", emoji: "💼" },
  { key: "🏠", emoji: "🏠" },
  { key: "🗣️", emoji: "🗣️" },
  { key: "📚", emoji: "📚" },
  { key: "💡", emoji: "💡" },
  { key: "🎯", emoji: "🎯" },
  { key: "❤️", emoji: "❤️" },
  { key: "🌱", emoji: "🌱" },
  { key: "⚡", emoji: "⚡" },
];

const COLOR_KEY_TO_CSS: Record<string, string> = Object.fromEntries(
  AREA_COLOR_PRESETS.map(p => [p.key, p.cssVar]),
);

function resolveCssColor(color: string | null | undefined, fallback: string): string {
  if (!color) return fallback;
  if (color.startsWith("#") || color.startsWith("var(")) return color;
  return COLOR_KEY_TO_CSS[color] ?? fallback;
}

/** Merge defaults with per-user prefs (color / emoji icon). */
/** Palette key for an area: hub first, then template, else the life palette. */
export function areaVisualKey(
  ref: Pick<AreaRef, "templateKey" | "hubFor">,
): AreaVisualKey {
  if (ref.hubFor) return ref.hubFor;
  if (ref.templateKey === "work") return "work";
  if (ref.templateKey === "research") return "research";
  if (ref.templateKey === "language") return "language";
  return "life";
}

export function resolveAreaVisual(
  key: AreaVisualKey,
  pref?: Pick<AreaPrefRow, "color" | "icon"> | null,
): AreaVisual {
  const base = AREA_VISUAL[key] ?? AREA_VISUAL.life;
  const cssVar = resolveCssColor(pref?.color, base.cssVar);
  const customColor = Boolean(pref?.color);
  const emoji =
    pref?.icon && pref.icon.length <= 4 ? pref.icon : base.emoji;

  if (!customColor) {
    return { ...base, emoji };
  }

  return {
    ...base,
    emoji,
    cssVar,
    chip: "text-white",
    wash: "bg-[color-mix(in_srgb,var(--area-accent)_10%,transparent)]",
    text: "text-[color:var(--area-accent)]",
    borderTop: "border-t-[3px]",
    dot: "bg-[var(--area-accent)]",
  };
}

/** UserArea color/icon over the template palette. */
export function resolveAreaVisualFromRef(
  ref: Pick<AreaRef, "templateKey" | "hubFor" | "color" | "icon">,
): AreaVisual {
  return resolveAreaVisual(areaVisualKey(ref), { color: ref.color, icon: ref.icon });
}

/** Inline styles when user overrode color (Tailwind can't know the hex). */
export function areaVisualInline(
  visual: AreaVisual,
  pref?: Pick<AreaPrefRow, "color"> | null,
): Record<string, string> | undefined {
  if (!pref?.color) return undefined;
  const c = visual.cssVar;
  return {
    borderTopColor: c,
    ["--area-accent"]: c,
  };
}

export type AreaRelatedLink = {
  href: string;
  labelKey:
    | "relatedResearch"
    | "relatedDocs"
    | "relatedLanguage"
    | "relatedTasks"
    | "relatedCalendar";
};

/** Feature hubs from hubFor + effective modules (not AREA_VISUAL switches). */
export function areaRelatedLinksFromHub(
  hubFor: HubKind | null,
  flags?: { research?: boolean; language?: boolean; tasks?: boolean; docs?: boolean },
): AreaRelatedLink[] {
  if (hubFor === "research") {
    const links: AreaRelatedLink[] = [];
    if (flags?.research !== false) links.push({ href: "/research", labelKey: "relatedResearch" });
    if (flags?.docs !== false) links.push({ href: "/docs", labelKey: "relatedDocs" });
    return links;
  }
  if (hubFor === "language") {
    return flags?.language === false
      ? []
      : [{ href: "/language", labelKey: "relatedLanguage" }];
  }
  return [
    { href: "/tasks", labelKey: "relatedTasks" },
    { href: "/calendar", labelKey: "relatedCalendar" },
  ];
}
