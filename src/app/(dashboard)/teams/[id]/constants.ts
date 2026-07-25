import type { Translations } from "@/i18n";

export const ROLE_DISPLAY_MAP: Record<string, keyof Translations["teams"]> = {
  ADMINISTRATOR: "roleAdministrator",
  TEAM_LEAD: "roleTeamLead",
  MEMBER: "roleMember",
};

export const ROLE_ORDER: Record<string, number> = {
  ADMINISTRATOR: 0,
  TEAM_LEAD: 1,
  MEMBER: 2,
};
