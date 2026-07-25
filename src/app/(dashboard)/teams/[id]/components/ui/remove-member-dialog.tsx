"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { Dialog } from "@/components/ui-kit/overlays/dialog";
import { useTranslation } from "@/i18n/provider";

interface RemoveMemberDialogProps {
  removeTarget: { memberId: string; userName: string } | null;
  onClose: () => void;
  isPending: boolean;
  onRemoveConfirm: () => void;
}

export function RemoveMemberDialog({
  removeTarget,
  onClose,
  isPending,
  onRemoveConfirm,
}: RemoveMemberDialogProps) {
  const t = useTranslation();

  return (
    <Dialog
      open={!!removeTarget}
      onClose={onClose}
      title={t.teams.confirmRemoveTitle}
      description={
        removeTarget
          ? `${t.teams.confirmRemovePrefix} ${removeTarget.userName} ${t.teams.confirmRemoveSuffix}`
          : ""
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {t.common.cancel}
          </Button>
          <Button variant="danger" loading={isPending} onClick={onRemoveConfirm}>
            {t.teams.removeMember}
          </Button>
        </>
      }
    />
  );
}
