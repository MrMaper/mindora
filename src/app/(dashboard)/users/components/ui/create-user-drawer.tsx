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
import type { ModulePolicy } from "@/lib/modules";
import type { CreatedAccess } from "../hooks/use-users";
import { ModulePolicyEditor } from "./module-toggles";

interface CreateUserDrawerProps {
  open: boolean;
  onClose: () => void;
  t: Translations;
  language: "FA" | "EN";
  createForm: UseFormReturn<CreateUserInput>;
  modules: ModulePolicy;
  onModulesChange: (next: ModulePolicy) => void;
  actionError: string | null;
  isPending: boolean;
  createdAccess: CreatedAccess | null;
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
  createdAccess,
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
        createdAccess ? (
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
        {createdAccess ? (
          <CreatedAccessView t={t} language={language} access={createdAccess} />
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
                      : "Temporary password (optional)"
                  }
                  type="text"
                  placeholder={
                    language === "FA"
                      ? "خالی = لینک دعوت یک‌بارمصرف"
                      : "Empty = one-time invite link"
                  }
                  error={fieldState.error?.message}
                />
              )}
            />
            <ModulePolicyEditor
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

function CreatedAccessView({
  t,
  language,
  access,
}: {
  t: Translations;
  language: "FA" | "EN";
  access: CreatedAccess;
}) {
  const fa = language === "FA";
  const [copied, setCopied] = React.useState(false);
  const link = access.invitePath
    ? `${typeof window === "undefined" ? "" : window.location.origin}${access.invitePath}`
    : null;

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-foreground">{t.users.userCreated}</p>
      {link ? (
        <>
          <div className="rounded-lg border bg-muted/40 px-3 py-2">
            <p className="text-xs text-muted-foreground">
              {fa ? "لینک دعوت (۷ روز، یک‌بارمصرف)" : "Invite link (7 days, single use)"}
            </p>
            <p className="mt-1 break-all font-mono text-xs select-all" dir="ltr">
              {link}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => void copy()}>
            {copied ? (fa ? "کپی شد" : "Copied") : fa ? "کپی لینک" : "Copy link"}
          </Button>
          <p className="text-xs text-muted-foreground">
            {access.emailed
              ? fa
                ? "لینک به ایمیل کاربر هم ارسال شد."
                : "The link was also emailed to the member."
              : fa
                ? "این لینک فقط همین یک‌بار نمایش داده می‌شود؛ آن را برای کاربر بفرست."
                : "This link is shown once only; send it to the member."}
          </p>
        </>
      ) : null}
      {access.tempPassword ? (
        <>
          <div className="rounded-lg border bg-muted/40 px-3 py-2">
            <p className="text-xs text-muted-foreground">{t.users.temporaryPassword}</p>
            <p className="mt-1 font-mono text-sm font-semibold select-all">
              {access.tempPassword}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {t.users.sharePassword}{" "}
            {fa
              ? "کاربر در اولین ورود باید رمز خودش را انتخاب کند."
              : "The member must choose their own password at first sign-in."}
          </p>
        </>
      ) : null}
    </div>
  );
}