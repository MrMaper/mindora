import * as React from "react";
import type { Metadata } from "next";
import { checkInviteToken } from "@/features/auth/actions";
import { AcceptInviteCC } from "./accept-invite-cc";

export const metadata: Metadata = { title: "Accept invite" };

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const state = await checkInviteToken(token);
  return (
    <React.Suspense>
      <AcceptInviteCC token={token ?? ""} tokenValid={state === "valid"} />
    </React.Suspense>
  );
}
