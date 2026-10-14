"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma as db } from "@/lib/db";
import { sendMail, buildPasswordResetEmail } from "@/lib/mail";
import { forgotPasswordSchema, resetPasswordSchema } from "@/schemas/auth";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function forgotPassword(formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData);
  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });

  // Always return success to prevent email enumeration
  if (!user) return { success: true };

  // Invalidate any existing tokens for this user
  await db.passwordResetToken.deleteMany({
    where: { userId: user.id, purpose: "RESET" },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  await sendMail({
    to: user.email,
    subject: "بازنشانی رمز عبور Mindora",
    html: buildPasswordResetEmail(resetUrl),
  });

  return { success: true };
}

export async function resetPassword(formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData);
  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const record = await db.passwordResetToken.findUnique({
    where: { token: parsed.data.token },
  });

  if (!record || record.purpose !== "RESET" || record.expiresAt < new Date()) {
    return { success: false, error: "لینک بازنشانی نامعتبر یا منقضی شده است" };
  }

  const hashed = await bcrypt.hash(parsed.data.password, 12);

  await db.user.update({
    where: { id: record.userId },
    data: { password: hashed, mustChangePassword: false },
  });

  await db.passwordResetToken.delete({ where: { id: record.id } });

  return { success: true };
}

export interface AcceptInviteResult extends ActionResult {
  email?: string;
}

/**
 * One-time invite: the person chooses their own password (docs/AREAS.md §8.2).
 * The caller then signs in with the returned email and the chosen password.
 */
export async function acceptInvite(
  formData: FormData,
): Promise<AcceptInviteResult> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const record = await db.passwordResetToken.findUnique({
    where: { token: parsed.data.token },
    include: { user: { select: { id: true, email: true, status: true } } },
  });

  if (
    !record ||
    record.purpose !== "INVITE" ||
    record.expiresAt < new Date() ||
    record.user.status !== "ACTIVE"
  ) {
    return { success: false, error: "inviteInvalid" };
  }

  const hashed = await bcrypt.hash(parsed.data.password, 12);
  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: {
        password: hashed,
        mustChangePassword: false,
        sessionVersion: { increment: 1 },
      },
    }),
    db.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  return { success: true, email: record.user.email };
}

/** Token state for the accept-invite page (never reveals who the token belongs to). */
export async function checkInviteToken(
  token: string | undefined,
): Promise<"valid" | "invalid"> {
  if (!token) return "invalid";
  const record = await db.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.purpose !== "INVITE" || record.expiresAt < new Date()) {
    return "invalid";
  }
  return "valid";
}
