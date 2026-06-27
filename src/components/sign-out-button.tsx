"use client";

import * as React from "react";
import { signOut } from "next-auth/react";
import { IconButton } from "@/components/ui-kit/forms/icon-button";

export function SignOutButton() {
  return (
    <IconButton
      icon="log-out"
      aria-label="Sign out"
      size="sm"
      onClick={() => signOut({ callbackUrl: "/login" })}
    />
  );
}
