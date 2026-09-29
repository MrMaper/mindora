"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui-kit/forms/button";
import { ResolvedValidationText } from "@/components/ui-kit/forms/action-error";
import { Input } from "@/components/ui-kit/forms/input";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { useTranslation } from "@/i18n/provider";
import { updateTeamSchema } from "@/schemas/teams";
import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import type { TeamRow } from "@/features/teams/types";

type EditTeamForm = UseFormReturn<z.infer<typeof updateTeamSchema>>;

interface EditTeamDrawerProps {
  open: boolean;
  onClose: () => void;
  actionError: string | null;
  isPending: boolean;
  editForm: EditTeamForm;
  editingTeam: TeamRow | null;
  onEditSubmit: () => void;
}

export function EditTeamDrawer({
  open,
  onClose,
  actionError,
  isPending,
  editForm,
  editingTeam,
  onEditSubmit,
}: EditTeamDrawerProps) {
  const t = useTranslation();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      header={
        <span className="text-sm font-semibold text-text-primary">
          {t.teams.editTeam}
        </span>
      }
      footer={
        <div className="flex gap-2 ml-auto">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {t.common.cancel}
          </Button>
          <Button variant="primary" loading={isPending} onClick={onEditSubmit}>
            {t.teams.saveChanges}
          </Button>
        </div>
      }
    >
      <div className="p-4 flex flex-col gap-4">
        {actionError && (
          <div
            className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg"
            role="alert"
          >
            <ResolvedValidationText text={actionError} />
          </div>
        )}
        {editingTeam && (
          <div className="flex items-center gap-3 p-3 bg-bg-sunken rounded-md">
            <div className="size-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
              {editingTeam.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-medium text-text-primary">
                {editingTeam.name}
              </div>
              <div className="text-xs text-text-tertiary">
                {editingTeam.memberCount} {t.teams.member}
              </div>
            </div>
          </div>
        )}
        <Controller
          name="name"
          control={editForm.control}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              label={t.teams.name}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="description"
          control={editForm.control}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              label={t.teams.description}
              error={fieldState.error?.message}
            />
          )}
        />
      </div>
    </Drawer>
  );
}
