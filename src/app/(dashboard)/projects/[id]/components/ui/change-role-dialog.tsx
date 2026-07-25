"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { Select } from "@/components/ui-kit/forms/select";
import { Dialog } from "@/components/ui-kit/overlays/dialog";
import type { Translations } from "@/i18n";

interface ChangeRoleDialogProps {
  open: boolean;
  onClose: () => void;
  t: Translations;
  currentRole: string;
  newRole: string;
  setNewRole: (role: string) => void;
  onSave: () => void;
}

export function ChangeRoleDialog({
  open,
  onClose,
  t,
  currentRole,
  newRole,
  setNewRole,
  onSave,
}: ChangeRoleDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t.projects.changeRole}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button variant="primary" onClick={onSave}>
            {t.common.save}
          </Button>
        </>
      }
    >
      <div className="p-4">
        <Select
          label={t.projects.selectRole}
          value={newRole}
          onChange={setNewRole}
          options={[
            { value: "OWNER", label: t.projects.roleOwner },
            { value: "ADMIN", label: t.projects.roleAdmin },
            { value: "MEMBER", label: t.projects.roleMember },
            { value: "VIEWER", label: t.projects.roleViewer },
          ]}
        />
      </div>
    </Dialog>
  );
}