"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Select } from "@/components/ui-kit/forms/select";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import type { Translations } from "@/i18n";
import type { UpdateUserInput } from "@/schemas/users";
import type { UserRow } from "@/features/users/types";
import type { UseFormReturn } from "react-hook-form";

interface EditUserDrawerProps {
  open: boolean;
  onClose: () => void;
  t: Translations;
  teams: { id: string; name: string }[];
  editForm: UseFormReturn<UpdateUserInput>;
  editingUser: UserRow | null;
  actionError: string | null;
  isPending: boolean;
  onEditSubmit: () => void;
}

export function EditUserDrawer({
  open,
  onClose,
  t,
  teams,
  editForm,
  editingUser,
  actionError,
  isPending,
  onEditSubmit,
}: EditUserDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      header={<span className="text-sm font-semibold text-foreground">{t.users.editUser}</span>}
      footer={
        <div className="flex gap-2 ml-auto">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {t.common.cancel}
          </Button>
          <Button variant="primary" loading={isPending} onClick={onEditSubmit}>
            {t.users.saveChanges}
          </Button>
        </div>
      }
    >
      <div className="p-4 flex flex-col gap-4">
        {actionError && (
          <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg" role="alert">
            {actionError}
          </div>
        )}
        {editingUser && (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
            <Avatar name={editingUser.name} src={editingUser.avatar ?? undefined} size="md" />
            <div>
              <div className="text-sm font-medium text-foreground">{editingUser.name}</div>
              <div className="text-xs text-muted-foreground">{editingUser.email}</div>
            </div>
          </div>
        )}
        <Controller
          name="name"
          control={editForm.control}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              label={t.users.fullName}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="role"
          control={editForm.control}
          render={({ field, fieldState }) => (
            <Select
              {...field}
              label={t.users.role}
              options={[
                { value: "MEMBER", label: t.users.member },
                { value: "ADMIN", label: t.users.admin },
              ]}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="teamId"
          control={editForm.control}
          render={({ field, fieldState }) => (
            <Select
              {...field}
              label={t.users.team}
              options={[
                { value: "", label: t.users.noTeam },
                ...teams.map((tm) => ({ value: tm.id, label: tm.name })),
              ]}
              error={fieldState.error?.message}
            />
          )}
        />
      </div>
    </Drawer>
  );
}