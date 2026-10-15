"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { localizedZodResolver } from "@/lib/validation-message";
import { updateProfileSchema, type UpdateProfileInput } from "@/schemas/users";
import { changePasswordSchema, type ChangePasswordInput } from "@/schemas/auth";
import {
  updateProfile,
  changePassword,
  uploadUserAvatar,
  setAvatarPresetAction,
  unlinkMyBale,
} from "@/features/users/actions";

export type ProfileInitial = {
  name: string;
  phone: string;
  bio: string;
};

export function useProfile(userId: string, initial: ProfileInitial) {
  const router = useRouter();

  const [profileSuccess, setProfileSuccess] = React.useState(false);
  const [profileError, setProfileError] = React.useState<string | null>(null);
  const [profilePending, startProfileTransition] = React.useTransition();

  const [passwordSuccess, setPasswordSuccess] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [passwordPending, startPasswordTransition] = React.useTransition();

  const [avatarError, setAvatarError] = React.useState<string | null>(null);
  const [avatarPending, startAvatarTransition] = React.useTransition();

  const [baleError, setBaleError] = React.useState<string | null>(null);
  const [balePending, startBaleTransition] = React.useTransition();

  const profileForm = useForm<UpdateProfileInput>({
    resolver: localizedZodResolver(updateProfileSchema),
    defaultValues: {
      name: initial.name,
      phone: initial.phone,
      bio: initial.bio,
    },
  });

  React.useEffect(() => {
    profileForm.reset({
      name: initial.name,
      phone: initial.phone,
      bio: initial.bio,
    });
  }, [initial.name, initial.phone, initial.bio, profileForm]);

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: localizedZodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
  });

  const onProfileSubmit = profileForm.handleSubmit(data => {
    setProfileError(null);
    setProfileSuccess(false);
    startProfileTransition(async () => {
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("phone", data.phone ?? "");
      fd.append("bio", data.bio ?? "");
      const result = await updateProfile(fd);
      if (!result.success) {
        setProfileError(result.error ?? "Failed to save.");
      } else {
        setProfileSuccess(true);
        router.refresh();
      }
    });
  });

  const onPasswordSubmit = passwordForm.handleSubmit(data => {
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
      e.target.value = "";
    });
  }

  function onAvatarPreset(presetId: string) {
    setAvatarError(null);
    startAvatarTransition(async () => {
      const result = await setAvatarPresetAction(presetId);
      if (!result.success) {
        setAvatarError(result.error ?? "Failed to set avatar.");
      } else {
        router.refresh();
      }
    });
  }

  function onUnlinkBale() {
    setBaleError(null);
    startBaleTransition(async () => {
      const result = await unlinkMyBale();
      if (!result.success) {
        setBaleError(result.error ?? "Failed to unlink.");
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
    onAvatarPreset,
    avatarError,
    avatarPending,
    onUnlinkBale,
    baleError,
    balePending,
  };
}
