"use client";

import type { Language } from "@/types/db";
import { getTranslations } from "@/i18n";

export interface OptionWithLabel {
  value: string;
  label: string;
}

export function getStatusLabel(language: Language, value: string): string {
  const t = getTranslations(language);
  const keyMap: Record<string, keyof typeof t.tasks> = {
    BACKLOG: "backlog",
    TODO: "todo",
    IN_PROGRESS: "inProgress",
    REVIEW: "review",
    TESTING: "testing",
    DONE: "done",
    BLOCKED: "blocked",
  };
  const key = keyMap[value];
  return key ? t.tasks[key] : value;
}

export function getPriorityLabel(language: Language, value: string): string {
  const t = getTranslations(language);
  const keyMap: Record<string, keyof typeof t.tasks> = {
    URGENT: "urgent",
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low",
    NONE: "none",
  };
  const key = keyMap[value];
  return key ? t.tasks[key] : value;
}

export function getTypeLabel(language: Language, value: string): string {
  const t = getTranslations(language);
  const keyMap: Record<string, keyof typeof t.tasks> = {
    TASK: "task",
    STORY: "story",
    BUG: "bug",
    EPIC: "epic",
  };
  const key = keyMap[value];
  return key ? t.tasks[key] : value;
}

export function getLabelForValue(
  language: Language,
  category: "status" | "priority" | "type",
  value: string,
): string {
  switch (category) {
    case "status":
      return getStatusLabel(language, value);
    case "priority":
      return getPriorityLabel(language, value);
    case "type":
      return getTypeLabel(language, value);
    default:
      return value;
  }
}

export function getAllOptionsWithLabels(
  language: Language,
  category: "status" | "priority" | "type",
): OptionWithLabel[] {
  const t = getTranslations(language);

  const statusMap: Record<string, keyof typeof t.tasks> = {
    BACKLOG: "backlog",
    TODO: "todo",
    IN_PROGRESS: "inProgress",
    REVIEW: "review",
    TESTING: "testing",
    DONE: "done",
    BLOCKED: "blocked",
  };

  const priorityMap: Record<string, keyof typeof t.tasks> = {
    URGENT: "urgent",
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low",
    NONE: "none",
  };

  const typeMap: Record<string, keyof typeof t.tasks> = {
    TASK: "task",
    STORY: "story",
    BUG: "bug",
    EPIC: "epic",
  };

  const map =
    category === "status"
      ? statusMap
      : category === "priority"
        ? priorityMap
        : typeMap;

  return Object.entries(map).map(([value, labelKey]) => ({
    value,
    label: t.tasks[labelKey],
  }));
}

export function withEmptyOption<T extends OptionWithLabel>(
  options: T[],
  emptyLabel: string,
): (T | OptionWithLabel)[] {
  return [{ value: "", label: emptyLabel }, ...options];
}