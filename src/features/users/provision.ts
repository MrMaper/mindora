import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma as db } from "@/lib/db";
import { buildInviteEmail, sendMail } from "@/lib/mail";
import {
  MODULE_PRESETS,
  isModulePresetId,
  policyToLegacyFlags,
  type ModulePolicy,
  type ModulePresetId,
} from "@/lib/modules";
import { ensurePersonalWorkspace } from "@/features/life/workspace";
import { getSystemSettings } from "@/features/admin/system";

/**
 * The only place that creates member accounts (docs/AREAS.md §8.1).
 * Called by the admin create form now and by public sign-up later.
 */

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type ProvisionChannel = "ADMIN_INVITE" | "SELF_SIGNUP";

export interface ProvisionMemberInput {
  name: string;
  email: string;
  createdVia: ProvisionChannel;
  /** Explicit per-module policy (Custom). Wins over `preset`. */
  policy?: ModulePolicy;
  /** Preset name; when omitted the system default for the channel applies. */
  preset?: ModulePresetId | null;
  /**
   * Admin-chosen temporary password. When set the member must change it at
   * first sign-in. When omitted an invite link is issued instead.
   */
  tempPassword?: string;
  /** Self sign-up: the person chose this password themselves. */
  password?: string;
}

export interface ProvisionMemberResult {
  userId: string;
  /** Invite mode: absolute-path token URL suffix, shown once to the admin. */
  inviteToken?: string;
  invitePath?: string;
  tempPassword?: string;
  emailed: boolean;
}

export function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pass = "Tmp@";
  const bytes = crypto.randomBytes(10);
  for (let i = 0; i < 10; i++) pass += chars[bytes[i]! % chars.length];
  return pass;
}

export function inviteUrl(token: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  return `${base}/accept-invite?token=${token}`;
}

export async function issueInviteToken(userId: string): Promise<string> {
  await db.passwordResetToken.deleteMany({
    where: { userId, purpose: "INVITE" },
  });
  const token = crypto.randomBytes(32).toString("hex");
  await db.passwordResetToken.create({
    data: {
      userId,
      token,
      purpose: "INVITE",
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });
  return token;
}

export async function provisionMember(
  input: ProvisionMemberInput,
): Promise<ProvisionMemberResult> {
  const settings = await getSystemSettings();
  const channelDefault =
    input.createdVia === "SELF_SIGNUP"
      ? settings.defaultModulePresetSignup
      : settings.defaultModulePresetAdmin;
  const presetId: ModulePresetId = isModulePresetId(input.preset)
    ? input.preset
    : isModulePresetId(channelDefault)
      ? channelDefault
      : "starter";
  const policy = input.policy ?? { ...MODULE_PRESETS[presetId] };

  const plain = input.password ?? input.tempPassword ?? null;
  const hashed = plain ? await bcrypt.hash(plain, 12) : null;

  const user = await db.user.create({
    data: {
      name: input.name,
      email: input.email,
      role: "MEMBER",
      password: hashed,
      status: "ACTIVE",
      createdVia: input.createdVia,
      modulePolicy: policy,
      // Mirror so an older build still reads the right flags.
      enabledModules: policyToLegacyFlags(policy),
      mustChangePassword: !!input.tempPassword,
    },
  });

  await ensurePersonalWorkspace(user.id);

  if (plain) {
    // Temp-password mode: the password is shown once in the admin UI.
    // It is never logged and never emailed.
    return {
      userId: user.id,
      tempPassword: input.tempPassword,
      emailed: false,
    };
  }

  const token = await issueInviteToken(user.id);
  let emailed = false;
  if (process.env.SMTP_HOST) {
    try {
      await sendMail({
        to: user.email,
        subject: "حساب کاربری Mindora شما",
        html: buildInviteEmail(inviteUrl(token), user.name),
      });
      emailed = true;
    } catch (err) {
      console.error("[users] invite email failed", err);
    }
  }
  return {
    userId: user.id,
    inviteToken: token,
    invitePath: `/accept-invite?token=${token}`,
    emailed,
  };
}
