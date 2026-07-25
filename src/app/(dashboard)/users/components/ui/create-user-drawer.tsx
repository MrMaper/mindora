"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Select } from "@/components/ui-kit/forms/select";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import type { Translations } from "@/i18n";
import type { CreateUserInput, UpdateUserInput } from "@/schemas/users";
import type { UseFormReturn } from "react-hook-form";

interface CreateUserDrawerProps {
  open: boolean;
  onClose: () => void;
  t: Translations;
  teams: { id: string; name: string }[];
  createForm: UseFormReturn<CreateUserInput>;
  actionError: string | null;
  isPending: boolean;
  createdPassword: string | null;
  onCreateSubmit: () => void;
}

export function CreateUserDrawer({
  open,
  onClose,
  t,
  teams,
  createForm,
  actionError,
  isPending,
  createdPassword,
  onCreateSubmit,
}: CreateUserDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} header={<span className="text-sm font-semibold text-foreground">{t.users.createUser}</span>} footer={
      <div className="flex gap-2 ml-auto">
        <Button variant="ghost" onClick={onClose} disabled={isPending}>
          {t.common.cancel}
        </Button>
        <Button variant="primary" loading={isPending} onClick={onCreateSubmit}>
          {t.users.createUser}
        </Button>
      </div>
    }>
      <div className="p-4 flex flex-col gap-4">
        {createdPassword ? (
          <CreatedPasswordView t={t} createdPassword={createdPassword} onDone={onClose} />
        ) : (
          <>
            {actionError && (
              <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg" role="alert">
                {actionError}
              </div>
            )}
            <Controller
              name="name"
              control={createForm.control}
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                  label={t.users.fullName}
                  placeholder={t.users.fullNamePlaceholder}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="email"
              control={createForm.control}
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                  label={t.users.email}
                  type="email"
                  placeholder="jane@company.com"
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="role"
              control={createForm.control}
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
              control={createForm.control}
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
          </>
        )}
      </div>
    </Drawer>
  );
}

function CreatedPasswordView({
  t,
  createdPassword,
  onDone,
}: {
  t: Translations;
  createdPassword: string;
  onDone: () => void;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2 p-3 text-sm text-success bg-success/10 border border-success/20 rounded-lg" role="status">
        {t.users.userCreated}
      </div>
      <div className="bg-muted border border-border rounded-md p-3">
        <div className="mb-1 text-xs text-muted-foreground">{t.users.temporaryPassword}</div>
        <code className="font-mono text-sm text-foreground font-semibold">{createdPassword}</code>
        <p className="mt-2 text-xs text-muted-foreground">{t.users.sharePassword}</p>
        <Button variant="secondary" className="mt-4" onClick={onDone}>
          {t.users.done}
        </Button>
      </div>
    </div>
  );
}