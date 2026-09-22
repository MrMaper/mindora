"use client";

import type { Translations } from "@/i18n";

type Category =
  | "status"
  | "priority"
  | "type"
  | "projectStatus"
  | "projectRole"
  | "teamRole"
  | "teamStatus"
  | "userRole"
  | "userStatus";

export interface OptionWithLabel {
  value: string;
  label: string;
}

export function getStatusLabel(t: Translations, value: string): string {
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

export function getPriorityLabel(t: Translations, value: string): string {
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

export function getTypeLabel(t: Translations, value: string): string {
  const keyMap: Record<string, keyof typeof t.tasks> = {
    TASK: "task",
    STORY: "story",
    BUG: "bug",
    EPIC: "epic",
  };
  const key = keyMap[value];
  return key ? t.tasks[key] : value;
}

export function getProjectStatusLabel(t: Translations, value: string): string {
  const keyMap: Record<string, keyof typeof t.projects> = {
    ACTIVE: "active",
    ARCHIVED: "archived",
    ON_HOLD: "onHold",
  };
  const key = keyMap[value];
  return key ? t.projects[key] : value;
}

export function getProjectRoleLabel(t: Translations, value: string): string {
  const keyMap: Record<string, keyof typeof t.projects> = {
    OWNER: "roleOwner",
    ADMIN: "roleAdmin",
    MEMBER: "roleMember",
    VIEWER: "roleViewer",
  };
  const key = keyMap[value];
  return key ? t.projects[key] : value;
}

export function getTeamRoleLabel(t: Translations, value: string): string {
  const keyMap: Record<string, keyof typeof t.teams> = {
    ADMINISTRATOR: "roleAdministrator",
    TEAM_LEAD: "roleTeamLead",
    MEMBER: "roleMember",
  };
  const key = keyMap[value];
  return key ? t.teams[key] : value;
}

export function getTeamStatusLabel(t: Translations, value: string): string {
  const keyMap: Record<string, keyof typeof t.teams> = {
    ACTIVE: "active",
    ARCHIVED: "archived",
  };
  const key = keyMap[value];
  return key ? t.teams[key] : value;
}

export function getUserRoleLabel(t: Translations, value: string): string {
  const keyMap: Record<string, keyof typeof t.users> = {
    ADMIN: "admin",
    MEMBER: "member",
  };
  const key = keyMap[value];
  return key ? t.users[key] : value;
}

export function getUserStatusLabel(t: Translations, value: string): string {
  const keyMap: Record<string, keyof typeof t.users> = {
    ACTIVE: "active",
    INACTIVE: "inactive",
  };
  const key = keyMap[value];
  return key ? t.users[key] : value;
}

export function getLabelForValue(
  t: Translations,
  category: Category,
  value: string,
): string {
  switch (category) {
    case "status":
      return getStatusLabel(t, value);
    case "priority":
      return getPriorityLabel(t, value);
    case "type":
      return getTypeLabel(t, value);
    case "projectStatus":
      return getProjectStatusLabel(t, value);
    case "projectRole":
      return getProjectRoleLabel(t, value);
    case "teamRole":
      return getTeamRoleLabel(t, value);
    case "teamStatus":
      return getTeamStatusLabel(t, value);
    case "userRole":
      return getUserRoleLabel(t, value);
    case "userStatus":
      return getUserStatusLabel(t, value);
    default:
      return value;
  }
}

export function getAllOptionsWithLabels(
  t: Translations,
  category: Category,
): OptionWithLabel[] {
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

  const projectStatusMap: Record<string, keyof typeof t.projects> = {
    ACTIVE: "active",
    ARCHIVED: "archived",
    ON_HOLD: "onHold",
  };

  const projectRoleMap: Record<string, keyof typeof t.projects> = {
    OWNER: "roleOwner",
    ADMIN: "roleAdmin",
    MEMBER: "roleMember",
    VIEWER: "roleViewer",
  };

  const teamRoleMap: Record<string, keyof typeof t.teams> = {
    ADMINISTRATOR: "roleAdministrator",
    TEAM_LEAD: "roleTeamLead",
    MEMBER: "roleMember",
  };

  const teamStatusMap: Record<string, keyof typeof t.teams> = {
    ACTIVE: "active",
    ARCHIVED: "archived",
  };

  const userRoleMap: Record<string, keyof typeof t.users> = {
    ADMIN: "admin",
    MEMBER: "member",
  };

  const userStatusMap: Record<string, keyof typeof t.users> = {
    ACTIVE: "active",
    INACTIVE: "inactive",
  };

  switch (category) {
    case "status":
      return Object.entries(statusMap).map(([value, labelKey]) => ({
        value,
        label: t.tasks[labelKey],
      }));
    case "priority":
      return Object.entries(priorityMap).map(([value, labelKey]) => ({
        value,
        label: t.tasks[labelKey],
      }));
    case "type":
      return Object.entries(typeMap).map(([value, labelKey]) => ({
        value,
        label: t.tasks[labelKey],
      }));
    case "projectStatus":
      return Object.entries(projectStatusMap).map(([value, labelKey]) => ({
        value,
        label: t.projects[labelKey],
      }));
    case "projectRole":
      return Object.entries(projectRoleMap).map(([value, labelKey]) => ({
        value,
        label: t.projects[labelKey],
      }));
    case "teamRole":
      return Object.entries(teamRoleMap).map(([value, labelKey]) => ({
        value,
        label: t.teams[labelKey],
      }));
    case "teamStatus":
      return Object.entries(teamStatusMap).map(([value, labelKey]) => ({
        value,
        label: t.teams[labelKey],
      }));
    case "userRole":
      return Object.entries(userRoleMap).map(([value, labelKey]) => ({
        value,
        label: t.users[labelKey],
      }));
    case "userStatus":
      return Object.entries(userStatusMap).map(([value, labelKey]) => ({
        value,
        label: t.users[labelKey],
      }));
    default:
      return [];
  }
}

export function withEmptyOption<T extends OptionWithLabel>(
  options: T[],
  emptyLabel: string,
): (T | OptionWithLabel)[] {
  return [{ value: "", label: emptyLabel }, ...options];
}
