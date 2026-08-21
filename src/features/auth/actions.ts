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
  await db.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  await sendMail({
    to: user.email,
    subject: "بازنشانی رمز عبور ScrumFlow",
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

  if (!record || record.expiresAt < new Date()) {
    return { success: false, error: "لینک بازنشانی نامعتبر یا منقضی شده است" };
  }

  const hashed = await bcrypt.hash(parsed.data.password, 12);

  await db.user.update({
    where: { id: record.userId },
    data: { password: hashed },
  });

  await db.passwordResetToken.delete({ where: { id: record.id } });

  return { success: true };
}
