"use server";

import { prisma as db } from "@/lib/db";
import { getSystemSettings } from "@/features/admin/system";
import { provisionMember } from "@/features/users/provision";
import { signupSchema } from "@/schemas/auth";

export type SignupActionResult =
  | { success: true }
  | { success: false; error: string };

export async function selfSignUpAction(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<SignupActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "invalid",
    };
  }

  const settings = await getSystemSettings();
  if (!settings.signupEnabled) {
    return {
      success: false,
      error: "signupClosed",
    };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return { success: false, error: "emailTaken" };
  }

  const active = await db.user.count({
    where: { status: "ACTIVE", role: "MEMBER" },
  });
  if (active >= settings.maxActiveMembers) {
    return { success: false, error: "signupFull" };
  }

  try {
    await provisionMember({
      name: parsed.data.name.trim(),
      email,
      password: parsed.data.password,
      createdVia: "SELF_SIGNUP",
    });
  } catch {
    return { success: false, error: "signupFailed" };
  }

  return { success: true };
}

export async function getSignupEnabled(): Promise<boolean> {
  const settings = await getSystemSettings();
  return Boolean(settings.signupEnabled);
}
