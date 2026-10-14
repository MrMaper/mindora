"use server";

import { revalidatePath } from "next/cache";
import { prisma as db } from "@/lib/db";
import { getModuleAccess } from "@/lib/module-guard";
import {
  PRIMARY_MODULES,
  applyMemberToggle,
  type PrimaryModule,
} from "@/lib/modules";
import { requireAuth } from "@/lib/require-role";

export interface ModulePrefResult {
  success: boolean;
  error?: string;
}

const REASON_COPY = {
  locked_on: "مدیر این قابلیت را فعال نگه داشته و قابل خاموش کردن نیست.",
  admin_off: "این قابلیت برای حساب تو فعال نشده. اگر لازمش داری از مدیر بخواه.",
  dependency_off:
    "این قابلیت به بخش دیگری وابسته است که مدیر برای حساب تو فعال نکرده.",
} as const;

/**
 * Member flips a module whose admin policy is `member_choice`.
 * Server-side enforcement: off / on modules cannot be changed (docs/AREAS.md §7.5).
 */
export async function setMemberModulePreference(
  module: PrimaryModule,
  enabled: boolean,
): Promise<ModulePrefResult> {
  const session = await requireAuth();
  if (session.user.role === "ADMIN") {
    return { success: false, error: "مدیر سیستم ماژول ندارد" };
  }
  if (!(PRIMARY_MODULES as readonly string[]).includes(module)) {
    return { success: false, error: "ماژول نامعتبر" };
  }

  const access = await getModuleAccess(session.user.id);
  if (!access) return { success: false, error: "کاربر یافت نشد" };

  const result = applyMemberToggle(access.policy, access.prefs, module, enabled);
  if (!result.ok) {
    return { success: false, error: REASON_COPY[result.reason] };
  }

  await db.userPreferences.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, moduleMemberPrefs: result.prefs },
    update: { moduleMemberPrefs: result.prefs },
  });

  revalidatePath("/", "layout");
  return { success: true };
}
