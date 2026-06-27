"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, type UpdateProfileInput } from "@/schemas/users";
import { changePasswordSchema, type ChangePasswordInput } from "@/schemas/auth";
import { updateProfile, changePassword, uploadUserAvatar } from "@/features/users/actions";

export function useProfile(userId: string) {
  const router = useRouter();

  const [profileSuccess, setProfileSuccess] = React.useState(false);
  const [profileError, setProfileError] = React.useState<string | null>(null);
  const [profilePending, startProfileTransition] = React.useTransition();

  const [passwordSuccess, setPasswordSuccess] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [passwordPending, startPasswordTransition] = React.useTransition();

  const [avatarError, setAvatarError] = React.useState<string | null>(null);
  const [avatarPending, startAvatarTransition] = React.useTransition();

  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
  });

  const onProfileSubmit = profileForm.handleSubmit((data) => {
    setProfileError(null);
    setProfileSuccess(false);
    startProfileTransition(async () => {
      const fd = new FormData();
      fd.append("name", data.name);
      const result = await updateProfile(fd);
      if (!result.success) {
        setProfileError(result.error ?? "Failed to save.");
      } else {
        setProfileSuccess(true);
        router.refresh();
      }
    });
  });

  const onPasswordSubmit = passwordForm.handleSubmit((data) => {
    setPasswordError(null);
    setPasswordSuccess(false);
    startPasswordTransition(async () => {
      const fd = new FormData();
      fd.append("currentPassword", data.currentPassword);
      fd.append("password", data.password);
      fd.append("confirmPassword", data.confirmPassword);
      const result = await changePassword(fd);
      if (!result.success) {
        setPasswordError(result.error ?? "Failed to change password.");
      } else {
        setPasswordSuccess(true);
        passwordForm.reset();
      }
    });
  });

  function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    startAvatarTransition(async () => {
      const fd = new FormData();
      fd.append("avatar", file);
      const result = await uploadUserAvatar(userId, fd);
      if (!result.success) {
        setAvatarError(result.error ?? "Upload failed.");
      } else {
        router.refresh();
      }
    });
  }

  return {
    profileForm,
    onProfileSubmit,
    profileSuccess,
    profileError,
    profilePending,
    passwordForm,
    onPasswordSubmit,
    passwordSuccess,
    passwordError,
    passwordPending,
    onAvatarChange,
    avatarError,
    avatarPending,
  };
}
