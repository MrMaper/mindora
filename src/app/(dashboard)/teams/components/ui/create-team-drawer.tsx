"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui-kit/forms/button";
import { ResolvedValidationText } from "@/components/ui-kit/forms/action-error";
import { Input } from "@/components/ui-kit/forms/input";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { useTranslation } from "@/i18n/provider";
import { createTeamSchema } from "@/schemas/teams";
import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";

type CreateTeamForm = UseFormReturn<z.infer<typeof createTeamSchema>>;

interface CreateTeamDrawerProps {
  open: boolean;
  onClose: () => void;
  actionError: string | null;
  isPending: boolean;
  createForm: CreateTeamForm;
  onCreateSubmit: () => void;
}

export function CreateTeamDrawer({
  open,
  onClose,
  actionError,
  isPending,
  createForm,
  onCreateSubmit,
}: CreateTeamDrawerProps) {
  const t = useTranslation();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      header={
        <span className="text-sm font-semibold text-text-primary">
          {t.teams.createTeam}
        </span>
      }
      footer={
        <div className="flex gap-2 ml-auto">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
          >
            {t.common.cancel}
          </Button>
          <Button
            variant="primary"
            loading={isPending}
            onClick={onCreateSubmit}
          >
            {t.teams.createTeam}
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
        <Controller
          name="name"
          control={createForm.control}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              label={t.teams.name}
              placeholder={t.teams.namePlaceholder}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="description"
          control={createForm.control}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              label={t.teams.description}
              placeholder={t.teams.descriptionPlaceholder}
              error={fieldState.error?.message}
            />
          )}
        />
      </div>
    </Drawer>
  );
}
