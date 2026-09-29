"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui-kit/forms/button";
import { ResolvedValidationText } from "@/components/ui-kit/forms/action-error";
import { Input } from "@/components/ui-kit/forms/input";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import type { Translations } from "@/i18n";
import type { CreateUserInput } from "@/schemas/users";
import type { UseFormReturn } from "react-hook-form";
import type { ModuleFlags } from "@/lib/modules";
import { ModuleToggles } from "./module-toggles";

interface CreateUserDrawerProps {
  open: boolean;
  onClose: () => void;
  t: Translations;
  language: "FA" | "EN";
  createForm: UseFormReturn<CreateUserInput>;
  modules: ModuleFlags;
  onModulesChange: (next: ModuleFlags) => void;
  actionError: string | null;
  isPending: boolean;
  createdPassword: string | null;
  onCreateSubmit: () => void;
}

export function CreateUserDrawer({
  open,
  onClose,
  t,
  language,
  createForm,
  modules,
  onModulesChange,
  actionError,
  isPending,
  createdPassword,
  onCreateSubmit,
}: CreateUserDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      header={
        <span className="text-sm font-semibold text-foreground">
          {t.users.createUser}
        </span>
      }
      footer={
        createdPassword ? (
          <Button variant="primary" onClick={onClose}>
            {t.users.done}
          </Button>
        ) : (
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" onClick={onClose} disabled={isPending}>
              {t.common.cancel}
            </Button>
            <Button variant="primary" loading={isPending} onClick={onCreateSubmit}>
              {t.users.createUser}
            </Button>
          </div>
        )
      }
    >
      <div className="p-4 flex flex-col gap-4">
        {createdPassword ? (
          <CreatedPasswordView t={t} createdPassword={createdPassword} />
        ) : (
          <>
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
                  placeholder="user@example.com"
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="password"
              control={createForm.control}
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  label={
                    language === "FA"
                      ? "رمز موقت (اختیاری)"
                      : "Temp password (optional)"
                  }
                  type="text"
                  placeholder={
                    language === "FA"
                      ? "خالی = تولید خودکار"
                      : "Empty = auto-generate"
                  }
                  error={fieldState.error?.message}
                />
              )}
            />
            <ModuleToggles
              value={modules}
              onChange={onModulesChange}
              language={language}
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
}: {
  t: Translations;
  createdPassword: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-foreground">{t.users.userCreated}</p>
      <div className="rounded-lg border bg-muted/40 px-3 py-2">
        <p className="text-xs text-muted-foreground">{t.users.temporaryPassword}</p>
        <p className="mt-1 font-mono text-sm font-semibold select-all">
          {createdPassword}
        </p>
      </div>
      <p className="text-xs text-muted-foreground">{t.users.sharePassword}</p>
    </div>
  );
}
