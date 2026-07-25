"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { Dialog } from "@/components/ui-kit/overlays/dialog";
import type { Translations } from "@/i18n";

interface RemoveMemberDialogProps {
  open: boolean;
  onClose: () => void;
  t: Translations;
  removeTarget: { id: string; name: string } | null;
  onConfirm: () => void;
}

export function RemoveMemberDialog({
  open,
  onClose,
  t,
  removeTarget,
  onConfirm,
}: RemoveMemberDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t.projects.confirmRemoveTitle}
      description={
        removeTarget
          ? `${t.projects.confirmRemovePrefix} ${removeTarget.name} ${t.projects.confirmRemoveSuffix}`
          : ""
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={!removeTarget}>
            {t.projects.removeMember}
          </Button>
        </>
      }
    />
  );
}