"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { writeAdminAudit } from "@/features/admin/audit";
import { sendAdminBroadcast, type BroadcastAudience } from "@/features/admin/broadcast";
import { unlockUserLogin } from "@/features/admin/login-lock";
import {
  type PlanCode,
  updateSystemPlan,
} from "@/features/admin/system";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/users");
  revalidatePath("/notifications");
}

export async function sendBroadcastAction(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  data?: { recipients: number; emailed: number };
}> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "غیرمجاز" };

  const title = String(formData.get("title") ?? "");
  const body = String(formData.get("body") ?? "");
  const audience = String(formData.get("audience") ?? "members_only") as BroadcastAudience;
  const channel = String(formData.get("channel") ?? "both") as
    | "in_app"
    | "email"
    | "both";

  if (!["all_active", "members_only", "admins_only"].includes(audience)) {
    return { success: false, error: "مخاطب نامعتبر است" };
  }
  if (!["in_app", "email", "both"].includes(channel)) {
    return { success: false, error: "کانال نامعتبر است" };
  }
  if (!title.trim() || !body.trim()) {
    return { success: false, error: "عنوان و متن الزامی است" };
  }

  try {
    const result = await sendAdminBroadcast({
      actorId: session.user.id,
      title,
      body,
      audience,
      channel,
    });
    await writeAdminAudit({
      actorId: session.user.id,
      action: "BROADCAST_SENT",
      summary: `اعلان سیستمی برای ${result.recipients} نفر`,
      meta: { audience, channel, emailed: result.emailed, title: title.trim() },
    });
    revalidateAdmin();
    return { success: true, data: result };
  } catch {
    return { success: false, error: "ارسال اعلان ممکن نشد" };
  }
}

export async function updatePlanAction(formData: FormData): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "غیرمجاز" };

  const planCode = String(formData.get("planCode") ?? "personal") as PlanCode;
  if (!["personal", "team", "custom"].includes(planCode)) {
    return { success: false, error: "پلن نامعتبر است" };
  }

  const planLabel = String(formData.get("planLabel") ?? "").trim();
  const quotaGb = Number(formData.get("storageQuotaGb") ?? "");
  const maxMembers = Number(formData.get("maxActiveMembers") ?? "");

  try {
    if (planCode === "custom") {
      if (!planLabel || !Number.isFinite(quotaGb) || quotaGb <= 0) {
        return { success: false, error: "برچسب و سهمیه پلن سفارشی الزامی است" };
      }
      await updateSystemPlan({
        planCode: "custom",
        planLabel,
        storageQuotaBytes: BigInt(Math.round(quotaGb * 1024 * 1024 * 1024)),
        maxActiveMembers: Number.isFinite(maxMembers) && maxMembers > 0
          ? Math.floor(maxMembers)
          : 25,
      });
    } else {
      await updateSystemPlan({ planCode });
    }

    await writeAdminAudit({
      actorId: session.user.id,
      action: "PLAN_UPDATED",
      summary: `پلن سامانه به ${planCode} تغییر کرد`,
      meta: { planCode, planLabel: planLabel || null },
    });
    revalidateAdmin();
    return { success: true };
  } catch (err) {
    console.error("[admin:plan]", err);
    return { success: false, error: "ذخیره پلن ممکن نشد" };
  }
}

export async function unlockLoginAction(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "غیرمجاز" };

  try {
    await unlockUserLogin(userId);
    await writeAdminAudit({
      actorId: session.user.id,
      action: "LOGIN_UNLOCKED",
      summary: "قفل ورود کاربر باز شد",
      targetUserId: userId,
    });
    revalidateAdmin();
    return { success: true };
  } catch {
    return { success: false, error: "باز کردن قفل ممکن نشد" };
  }
}
