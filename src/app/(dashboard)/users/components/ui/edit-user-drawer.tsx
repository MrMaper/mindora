"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui-kit/forms/button";
import { ResolvedValidationText } from "@/components/ui-kit/forms/action-error";
import { Input } from "@/components/ui-kit/forms/input";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import type { Translations } from "@/i18n";
import type { UpdateUserInput } from "@/schemas/users";
import type { UserLoginEventRow, UserRow } from "@/features/users/types";
import type { UseFormReturn } from "react-hook-form";
import type { ModuleFlags } from "@/lib/modules";
import { formatPresenceInstant } from "@/lib/presence";
import { ModuleToggles } from "./module-toggles";

interface EditUserDrawerProps {
  open: boolean;
  onClose: () => void;
  t: Translations;
  language: "FA" | "EN";
  editForm: UseFormReturn<UpdateUserInput>;
  editingUser: UserRow | null;
  modules: ModuleFlags;
  onModulesChange: (next: ModuleFlags) => void;
  actionError: string | null;
  isPending: boolean;
  resetPassword: string | null;
  loginEvents: UserLoginEventRow[];
  onEditSubmit: () => void;
  onResetPassword: () => void;
  onForceLogout: () => void;
}

export function EditUserDrawer({
  open,
  onClose,
  t,
  language,
  editForm,
  editingUser,
  modules,
  onModulesChange,
  actionError,
  isPending,
  resetPassword,
  loginEvents,
  onEditSubmit,
  onResetPassword,
  onForceLogout,
}: EditUserDrawerProps) {
  const isAdmin = editingUser?.role === "ADMIN";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      header={
        <span className="text-sm font-semibold text-foreground">
          {t.users.editUser}
        </span>
      }
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
          <div
            className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg"
            role="alert"
          >
            <ResolvedValidationText text={actionError} />
          </div>
        )}
        {editingUser && (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
            <Avatar
              name={editingUser.name}
              src={editingUser.avatar ?? undefined}
              size="md"
            />
            <div>
              <div className="text-sm font-medium text-foreground">
                {editingUser.name}
              </div>
              <div className="text-xs text-muted-foreground" dir="ltr">
                {editingUser.email}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {isAdmin ? t.users.admin : t.users.member}
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
              label={t.users.fullName}
              error={fieldState.error?.message}
            />
          )}
        />
        {!isAdmin && (
          <ModuleToggles
            value={modules}
            onChange={onModulesChange}
            language={language}
          />
        )}
        {isAdmin && (
          <div className="rounded-lg border px-3 py-2 flex flex-col gap-1.5">
            <p className="text-xs text-muted-foreground">
              {language === "FA"
                ? "مدیر سیستم فقط برای مدیریت کاربران است و ماژول شخصی ندارد."
                : "The system admin is management-only and has no personal modules."}
            </p>
            <a
              href="/settings?tab=profile"
              className="text-xs font-medium text-primary hover:underline"
            >
              {language === "FA"
                ? "تغییر رمز عبور از پروفایل ←"
                : "Change password in Profile →"}
            </a>
          </div>
        )}
        {!isAdmin && (
          <div className="rounded-lg border px-3 py-2 flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                loading={isPending}
                onClick={onResetPassword}
                type="button"
              >
                {language === "FA" ? "بازنشانی رمز عبور" : "Reset password"}
              </Button>
              <Button
                variant="subtle"
                loading={isPending}
                onClick={onForceLogout}
                type="button"
                icon="log-out"
              >
                {t.users.forceLogout}
              </Button>
            </div>
            {resetPassword && (
              <div className="rounded-md bg-muted/50 px-2 py-1.5">
                <p className="text-[11px] text-muted-foreground">
                  {t.users.temporaryPassword}
                </p>
                <p className="font-mono text-sm font-semibold select-all">
                  {resetPassword}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="rounded-lg border px-3 py-2">
          <h3 className="mb-2 text-xs font-semibold text-foreground">
            {t.users.loginHistory}
          </h3>
          {loginEvents.length === 0 ? (
            <p className="py-2 text-xs text-muted-foreground">
              {t.users.loginHistoryEmpty}
            </p>
          ) : (
            <ul className="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
              {loginEvents.map(ev => (
                <li
                  key={ev.id}
                  className="rounded-md bg-muted/40 px-2 py-1.5 text-[11px]"
                >
                  <div className="font-medium text-foreground">
                    {formatPresenceInstant(ev.createdAt, language)}
                  </div>
                  {ev.ip ? (
                    <div className="text-muted-foreground" dir="ltr">
                      {t.users.loginIp}: {ev.ip}
                    </div>
                  ) : null}
                  {ev.userAgent ? (
                    <div
                      className="truncate text-muted-foreground"
                      dir="ltr"
                      title={ev.userAgent}
                    >
                      {t.users.loginDevice}: {ev.userAgent}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Drawer>
  );
}
