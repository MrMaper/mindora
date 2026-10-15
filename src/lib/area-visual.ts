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

/** Preset color keys users can pick for an area (site palette + extras). */
export const AREA_COLOR_PRESETS: {
  key: string;
  labelFa: string;
  labelEn: string;
  cssVar: string;
}[] = [
  { key: "brand", labelFa: "برند", labelEn: "Brand", cssVar: "var(--brand-600)" },
  { key: "brand-deep", labelFa: "نیلی تیره", labelEn: "Deep indigo", cssVar: "var(--brand-800)" },
  { key: "review", labelFa: "بنفش", labelEn: "Purple", cssVar: "var(--status-review)" },
  { key: "violet", labelFa: "بنفش روشن", labelEn: "Violet", cssVar: "#8b5cf6" },
  { key: "fuchsia", labelFa: "سرخابی", labelEn: "Fuchsia", cssVar: "#d946ef" },
  { key: "rose", labelFa: "صورتی", labelEn: "Rose", cssVar: "#e11d48" },
  { key: "red", labelFa: "قرمز", labelEn: "Red", cssVar: "var(--red-500)" },
  { key: "orange", labelFa: "نارنجی", labelEn: "Orange", cssVar: "var(--status-in-progress)" },
  { key: "amber", labelFa: "کهربایی", labelEn: "Amber", cssVar: "var(--amber-500)" },
  { key: "yellow", labelFa: "زرد", labelEn: "Yellow", cssVar: "var(--priority-medium)" },
  { key: "lime", labelFa: "سبز روشن", labelEn: "Lime", cssVar: "#84cc16" },
  { key: "done", labelFa: "سبز", labelEn: "Green", cssVar: "var(--status-done)" },
  { key: "emerald", labelFa: "زمردی", labelEn: "Emerald", cssVar: "#059669" },
  { key: "teal", labelFa: "فیروزه", labelEn: "Teal", cssVar: "#14b8a6" },
  { key: "cyan", labelFa: "آبی روشن", labelEn: "Cyan", cssVar: "var(--status-testing)" },
  { key: "sky", labelFa: "آسمانی", labelEn: "Sky", cssVar: "#0ea5e9" },
  { key: "blue", labelFa: "آبی", labelEn: "Blue", cssVar: "var(--status-todo)" },
  { key: "indigo", labelFa: "نیلی", labelEn: "Indigo", cssVar: "#6366f1" },
  { key: "slate", labelFa: "خاکستری", labelEn: "Slate", cssVar: "var(--gray-600)" },
  { key: "stone", labelFa: "سنگی", labelEn: "Stone", cssVar: "#78716c" },
];

/**
 * Stroke icons from the site kit (Lucide). Keys are stored on `UserArea.icon`.
 * Legacy emoji values still resolve via `resolveAreaIconName`.
 */
export const AREA_ICON_PRESETS: { key: IconName; labelFa: string; labelEn: string }[] = [
  { key: "home", labelFa: "خانه", labelEn: "Home" },
  { key: "briefcase", labelFa: "کار", labelEn: "Work" },
  { key: "graduation-cap", labelFa: "تحصیل", labelEn: "Study" },
  { key: "book-open", labelFa: "کتاب", labelEn: "Books" },
  { key: "file-text", labelFa: "نوشته", labelEn: "Writing" },
  { key: "language", labelFa: "زبان", labelEn: "Language" },
  { key: "lightbulb", labelFa: "ایده", labelEn: "Idea" },
  { key: "target", labelFa: "هدف", labelEn: "Goal" },
  { key: "flask", labelFa: "آزمایش", labelEn: "Lab" },
  { key: "code", labelFa: "کد", labelEn: "Code" },
  { key: "pen-line", labelFa: "قلم", labelEn: "Pen" },
  { key: "newspaper", labelFa: "خبر", labelEn: "News" },
  { key: "calendar", labelFa: "تقویم", labelEn: "Calendar" },
  { key: "timer", labelFa: "زمان", labelEn: "Timer" },
  { key: "zap", labelFa: "سرعت", labelEn: "Energy" },
  { key: "star", labelFa: "ستاره", labelEn: "Star" },
  { key: "sparkles", labelFa: "درخشش", labelEn: "Sparkles" },
  { key: "heart", labelFa: "علاقه", labelEn: "Heart" },
  { key: "heart-pulse", labelFa: "سلامت", labelEn: "Health" },
  { key: "stethoscope", labelFa: "پزشکی", labelEn: "Medical" },
  { key: "dumbbell", labelFa: "ورزش", labelEn: "Fitness" },
  { key: "sprout", labelFa: "رشد", labelEn: "Growth" },
  { key: "leaf", labelFa: "طبیعت", labelEn: "Nature" },
  { key: "coffee", labelFa: "کافه", labelEn: "Coffee" },
  { key: "utensils", labelFa: "غذا", labelEn: "Food" },
  { key: "music", labelFa: "موسیقی", labelEn: "Music" },
  { key: "mic", labelFa: "صدا", labelEn: "Mic" },
  { key: "camera", labelFa: "عکس", labelEn: "Camera" },
  { key: "palette", labelFa: "هنر", labelEn: "Art" },
  { key: "gamepad", labelFa: "بازی", labelEn: "Play" },
  { key: "plane", labelFa: "سفر", labelEn: "Travel" },
  { key: "car", labelFa: "رفت‌وآمد", labelEn: "Transit" },
  { key: "building", labelFa: "سازمان", labelEn: "Office" },
  { key: "landmark", labelFa: "عمومی", labelEn: "Civic" },
  { key: "wallet", labelFa: "مالی", labelEn: "Money" },
  { key: "shopping-bag", labelFa: "خرید", labelEn: "Shopping" },
  { key: "users", labelFa: "جمع", labelEn: "People" },
  { key: "baby", labelFa: "خانواده", labelEn: "Family" },
  { key: "folder", labelFa: "پوشه", labelEn: "Folder" },
  { key: "inbox", labelFa: "صندوق", labelEn: "Inbox" },
  { key: "layout-dashboard", labelFa: "داشبورد", labelEn: "Board" },
  { key: "columns", labelFa: "بورد", labelEn: "Kanban" },
  { key: "list", labelFa: "فهرست", labelEn: "List" },
  { key: "message-square", labelFa: "گفتگو", labelEn: "Chat" },
  { key: "mail", labelFa: "ایمیل", labelEn: "Mail" },
  { key: "bell", labelFa: "یادآور", labelEn: "Reminders" },
  { key: "flag", labelFa: "پرچم", labelEn: "Flag" },
  { key: "shield", labelFa: "امنیت", labelEn: "Security" },
  { key: "settings", labelFa: "تنظیم", labelEn: "Settings" },
];

const AREA_ICON_KEYS = new Set<string>(AREA_ICON_PRESETS.map(p => p.key));

/** Old emoji prefs → stroke icons (one-release read compat). */
const LEGACY_EMOJI_TO_ICON: Record<string, IconName> = {
  "🎓": "graduation-cap",
  "💼": "briefcase",
  "🏠": "home",
  "🗣️": "language",
  "📚": "book-open",
  "💡": "lightbulb",
  "🎯": "target",
  "❤️": "heart",
  "🌱": "sprout",
  "⚡": "zap",
};

const COLOR_KEY_TO_CSS: Record<string, string> = Object.fromEntries(
  AREA_COLOR_PRESETS.map(p => [p.key, p.cssVar]),
);

function resolveCssColor(color: string | null | undefined, fallback: string): string {
  if (!color) return fallback;
  if (color.startsWith("#") || color.startsWith("var(")) return color;
  return COLOR_KEY_TO_CSS[color] ?? fallback;
}

export function isAreaIconName(value: string | null | undefined): value is IconName {
  return Boolean(value && AREA_ICON_KEYS.has(value));
}

/** Resolve stored `UserArea.icon` (IconName or legacy emoji) to a kit icon. */
export function resolveAreaIconName(
  prefIcon: string | null | undefined,
  fallback: IconName,
): IconName {
  if (!prefIcon) return fallback;
  if (isAreaIconName(prefIcon)) return prefIcon;
  return LEGACY_EMOJI_TO_ICON[prefIcon] ?? fallback;
}

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
  const icon = resolveAreaIconName(pref?.icon, base.icon);
  // Keep emoji only as a last-resort text fallback for odd callers.
  const emoji = base.emoji;

  if (!customColor) {
    return { ...base, icon, emoji };
  }

  return {
    ...base,
    icon,
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
