"use client";
import { useTranslation } from "@/i18n/provider";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/ui-kit/foundation/icon";
import type { IconName } from "@/components/ui-kit/foundation/icon";
import { Select } from "@/components/ui-kit/forms/select";
import type { TeamRow } from "@/features/teams/types";

interface TeamSwitcherProps {
  teams: TeamRow[];
  currentTeamId: string | null;
  language: "EN" | "FA";
  onTeamChange: (teamId: string) => void;
}

export function TeamSwitcher({
  teams,
  currentTeamId,
  language,
  onTeamChange,
}: TeamSwitcherProps) {
  const t = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  if (teams.length === 0) return null;

  const handleChange = (teamId: string) => {
    onTeamChange(teamId);
    const STORAGE_KEY = `mindora-current-team-${teamId}`;
    localStorage.setItem(STORAGE_KEY, teamId);

    if (pathname.startsWith("/teams/")) {
      router.push(`/teams/${teamId}`);
      router.refresh();
      return;
    }
    router.refresh();
  };

  return (
    <div className="mb-3 pb-3 border-b border-border-muted">
      <label
        htmlFor="team-switcher"
        className="text-2xs font-semibold uppercase tracking-caps text-tertiary mb-1.5 block"
      >
        {t.teams.team}
      </label>
      <Select
        id="team-switcher"
        value={currentTeamId ?? ""}
        onChange={handleChange}
        options={[
          { value: "", label: t.teams.noTeam },
          ...teams.map((t) => ({ value: t.id, label: t.name })),
        ]}
        className="w-full"
      />
    </div>
  );
}