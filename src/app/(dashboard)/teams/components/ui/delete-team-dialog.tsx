"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { Dialog } from "@/components/ui-kit/overlays/dialog";
import { useTranslation } from "@/i18n/provider";
import type { TeamRow } from "@/features/teams/types";

interface DeleteTeamDialogProps {
  deleteTarget: TeamRow | null;
  onClose: () => void;
  isPending: boolean;
  onDeleteConfirm: () => void;
}

export function DeleteTeamDialog({
  deleteTarget,
  onClose,
  isPending,
  onDeleteConfirm,
}: DeleteTeamDialogProps) {
  const t = useTranslation();

  return (
    <Dialog
      open={!!deleteTarget}
      onClose={onClose}
      title={t.teams.deleteTeam}
      description={
        deleteTarget
          ? `${t.teams.deleteConfirmPrefix} ${deleteTarget.name} ${t.teams.deleteConfirmSuffix}`
          : ""
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {t.common.cancel}
          </Button>
          <Button variant="danger" loading={isPending} onClick={onDeleteConfirm}>
            {t.teams.deleteTeam}
          </Button>
        </>
      }
    />
  );
}
