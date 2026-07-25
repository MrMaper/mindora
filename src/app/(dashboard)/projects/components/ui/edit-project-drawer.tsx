"use client";

import * as React from "react";
import { Controller, type Control } from "react-hook-form";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { useTranslation } from "@/i18n/provider";

interface ProjectFormValues {
  name: string;
  description?: string;
  status?: "ACTIVE" | "ARCHIVED" | "ON_HOLD" | undefined;
}

interface EditProjectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  form: {
    control: Control<ProjectFormValues>;
    isPending: boolean;
  };
  editingProject: {
    name: string;
    memberCount: number;
  } | null;
  onSubmit: () => void;
  actionError: string | null;
  isPending: boolean;
}

export function EditProjectDrawer({
  isOpen,
  onClose,
  form,
  editingProject,
  onSubmit,
  actionError,
  isPending,
}: EditProjectDrawerProps) {
  const t = useTranslation();

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      header={
        <span className="text-sm font-semibold text-foreground">
          {t.projects.editProject}
        </span>
      }
      footer={
        <div className="flex gap-2 ml-auto">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {t.common.cancel}
          </Button>
          <Button variant="primary" loading={isPending} onClick={onSubmit}>
            {t.projects.saveChanges}
          </Button>
        </div>
      }
    >
      <div className="p-4 flex flex-col gap-4">
        {actionError && (
          <div
            className="auth-card__alert auth-card__alert--error"
            role="alert"
          >
            {actionError}
          </div>
        )}
        {editingProject && (
          <div className="flex items-center gap-3 p-3 bg-bg-sunken rounded-md">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
              {editingProject.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">
                {editingProject.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {editingProject.memberCount} members
              </div>
            </div>
          </div>
        )}
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              label={t.projects.name}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              label={t.projects.description}
              error={fieldState.error?.message}
            />
          )}
        />
      </div>
    </Drawer>
  );
}
