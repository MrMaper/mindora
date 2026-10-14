"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import { uploadAvatar as uploadToStorage } from "@/lib/storage";
import {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
} from "@/schemas/users";
import { changePasswordSchema } from "@/schemas/auth";
import {
  MODULE_PRESETS,
  MODULE_META,
  PRIMARY_MODULES,
  isModulePresetId,
  parseModulePolicy,
  policyToLegacyFlags,
  type ModulePolicy,
  type ModulePolicyState,
} from "@/lib/modules";
import {
  generateTempPassword,
  inviteUrl,
  issueInviteToken,
  provisionMember,
} from "@/features/users/provision";
import { revokeUserSessions } from "@/features/users/presence";
import { writeAdminAudit } from "@/features/admin/audit";
import { getSystemSettings } from "@/features/admin/system";

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

async function requireAdminSession() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

const POLICY_STATES: readonly string[] = ["off", "on", "member_choice"];

/**
 * Per-module policy from form fields `policy_<module>`.
 * Returns null when the form carries no policy fields (caller keeps stored policy
 * or applies a preset). Never interprets "no fields" as "everything on".
 */
function policyFromForm(
  formData: FormData,
  fallback: ModulePolicy,
): ModulePolicy | null {
  if (!PRIMARY_MODULES.some(k => formData.has(`policy_${k}`))) return null;
  const out = { ...fallback };
  for (const key of PRIMARY_MODULES) {
    const v = formData.get(`policy_${key}`)?.toString();
    if (v && POLICY_STATES.includes(v)) out[key] = v as ModulePolicyState;
  }
  return out;
}

/** In-app note so a member knows why their sidebar changed (docs/AREAS.md §7.5). */
async function notifyModulePolicyChange(
  userId: string,
  before: ModulePolicy,
  after: ModulePolicy,
) {
  const lines: string[] = [];
  for (const key of PRIMARY_MODULES) {
    if (before[key] === after[key]) continue;
    const name = MODULE_META[key].fa;
    if (after[key] === "off") lines.push(`ادمین قابلیت «${name}» را غیرفعال کرد`);
    else if (before[key] === "off") lines.push(`ادمین قابلیت «${name}» را فعال کرد`);
    else if (after[key] === "on") lines.push(`قابلیت «${name}» توسط ادمین ثابت فعال شد`);
    else lines.push(`قابلیت «${name}» حالا به انتخاب خودت است`);
  }
  if (lines.length === 0) return;
  await db.notification.create({
    data: {
      userId,
      type: "SYSTEM_BROADCAST",
      title: "دسترسی‌های حساب تو تغییر کرد",
      body: lines.join("\n"),
      data: { fromAdmin: true, kind: "modules" },
    },
  });
}

async function applyPolicyChange(
  adminId: string,
  userId: string,
  nextPolicy: ModulePolicy,
  current: { enabledModules: unknown; modulePolicy: unknown },
) {
  const before = parseModulePolicy(current.modulePolicy, current.enabledModules);
  await db.user.update({
    where: { id: userId },
    data: {
      modulePolicy: nextPolicy,
      enabledModules: policyToLegacyFlags(nextPolicy),
    },
  });
  await notifyModulePolicyChange(userId, before, nextPolicy);
  await writeAdminAudit({
    actorId: adminId,
    action: "MODULES_UPDATED",
    summary: "دسترسی ماژول‌های کاربر تغییر کرد",
    targetUserId: userId,
    meta: nextPolicy as unknown as Record<string, unknown>,
  });
}

// ─── Admin: create user (MEMBER only) ─────────────────────────────────────

export async function createUser(formData: FormData): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "غیرمجاز" };

  const parsed = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  // Product rule: only one system admin — new accounts are always MEMBER
  if (parsed.data.role === "ADMIN") {
    return {
      success: false,
      error: "فقط یک مدیر سیستم مجاز است؛ کاربر جدید به‌صورت عضو ساخته می‌شود",
    };
  }

  try {
    const existing = await db.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (existing) return { success: false, error: "کاربری با این ایمیل قبلاً وجود دارد" };

    // Blank password → one-time invite link; filled → temporary password
    // (member must change it at first sign-in).
    const tempPassword = formData.get("password")?.toString().trim() || undefined;
    if (tempPassword && tempPassword.length < 6) {
      return { success: false, error: "رمز عبور باید حداقل ۶ کاراکتر باشد" };
    }

    const presetRaw = formData.get("preset")?.toString();
    const customPolicy = policyFromForm(formData, MODULE_PRESETS.starter);
    const policy =
      presetRaw === "custom" || (!presetRaw && customPolicy)
        ? (customPolicy ?? undefined)
        : undefined;
    const preset = isModulePresetId(presetRaw) ? presetRaw : null;

    const settings = await getSystemSettings();
    const activeMembers = await db.user.count({
      where: { status: "ACTIVE", role: "MEMBER" },
    });
    if (activeMembers >= settings.maxActiveMembers) {
      return {
        success: false,
        error: `سقف اعضای فعال پلن (${settings.maxActiveMembers}) پر شده است`,
      };
    }

    const result = await provisionMember({
      name: parsed.data.name,
      email: parsed.data.email,
      createdVia: "ADMIN_INVITE",
      policy,
      preset,
      tempPassword,
    });

    await writeAdminAudit({
      actorId: session.user.id,
      action: "USER_CREATED",
      summary: `کاربر ${parsed.data.name} ساخته شد`,
      targetUserId: result.userId,
      meta: {
        email: parsed.data.email,
        mode: tempPassword ? "temp_password" : "invite_link",
      },
    });

    revalidatePath("/users");
    revalidatePath("/admin");
    return {
      success: true,
      data: {
        userId: result.userId,
        // Shown once in the admin UI. Never logged.
        tempPassword: result.tempPassword ?? null,
        invitePath: result.invitePath ?? null,
        emailed: result.emailed,
      },
    };
  } catch (err) {
    console.error("[users] createUser failed", err);
    return { success: false, error: "ساخت کاربر ممکن نشد" };
  }
}

// ─── Admin: update user ───────────────────────────────────────────────────

export async function updateUser(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "غیرمجاز" };

  const parsed = updateUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const target = await db.user.findUnique({
    where: { id },
    select: { role: true, enabledModules: true, modulePolicy: true },
  });
  if (!target) return { success: false, error: "کاربر یافت نشد" };

  // Never promote to ADMIN / demote the sole ADMIN
  if (target.role === "ADMIN") {
    if (parsed.data.role === "MEMBER") {
      return { success: false, error: "نمی‌توان مدیر سیستم را به عضو تبدیل کرد" };
    }
    await db.user.update({
      where: { id },
      data: { name: parsed.data.name },
    });
    await writeAdminAudit({
      actorId: session.user.id,
      action: "USER_UPDATED",
      summary: "نام مدیر سیستم به‌روز شد",
      targetUserId: id,
    });
    revalidatePath("/users");
    revalidatePath("/admin");
    return { success: true };
  }

  if (parsed.data.role === "ADMIN") {
    return { success: false, error: "فقط یک مدیر سیستم مجاز است" };
  }

  const currentPolicy = parseModulePolicy(
    target.modulePolicy,
    target.enabledModules,
  );
  const nextPolicy = policyFromForm(formData, currentPolicy);

  await db.user.update({
    where: { id },
    data: { name: parsed.data.name, role: "MEMBER" },
  });
  if (nextPolicy) {
    await applyPolicyChange(session.user.id, id, nextPolicy, target);
  } else {
    await writeAdminAudit({
      actorId: session.user.id,
      action: "USER_UPDATED",
      summary: "پروفایل کاربر به‌روز شد",
      targetUserId: id,
    });
  }
  revalidatePath("/users");
  revalidatePath("/admin");
  return { success: true };
}

/** Admin sets the full policy for one member (off / on / member_choice per module). */
export async function updateUserModules(
  id: string,
  policy: ModulePolicy,
): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "غیرمجاز" };

  const target = await db.user.findUnique({
    where: { id },
    select: { role: true, enabledModules: true, modulePolicy: true },
  });
  if (!target) return { success: false, error: "کاربر یافت نشد" };
  if (target.role === "ADMIN") {
    return { success: false, error: "ماژول‌ها برای مدیر سیستم معنا ندارد" };
  }

  const next = parseModulePolicy(policy, {});
  await applyPolicyChange(session.user.id, id, next, target);
  revalidatePath("/users");
  revalidatePath("/admin");
  return { success: true };
}

/** Admin issues a fresh one-time invite link (7 days) for a member. */
export async function createInviteLinkAction(id: string): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "غیرمجاز" };

  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, role: true, name: true },
  });
  if (!user) return { success: false, error: "کاربر یافت نشد" };
  if (user.role === "ADMIN") {
    return { success: false, error: "این کار برای مدیر سیستم مجاز نیست" };
  }

  const token = await issueInviteToken(id);
  await writeAdminAudit({
    actorId: session.user.id,
    action: "INVITE_LINK_CREATED",
    summary: `لینک دعوت برای ${user.name} ساخته شد`,
    targetUserId: id,
  });
  return {
    success: true,
    data: { invitePath: `/accept-invite?token=${token}`, inviteUrl: inviteUrl(token) },
  };
}

export async function toggleUserStatus(id: string): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "غیرمجاز" };

  if (id === session.user.id) {
    return { success: false, error: "شما نمی‌توانید حساب کاربری خود را غیرفعال کنید" };
  }

  const user = await db.user.findUnique({
    where: { id },
    select: { status: true, role: true },
  });
  if (!user) return { success: false, error: "کاربر یافت نشد" };

  if (user.role === "ADMIN") {
    return { success: false, error: "نمی‌توان مدیر سیستم را غیرفعال کرد" };
  }

  const nextStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await db.user.update({
    where: { id },
    data: {
      status: nextStatus,
      ...(nextStatus === "INACTIVE"
        ? { sessionVersion: { increment: 1 } }
        : {}),
    },
  });
  await writeAdminAudit({
    actorId: session.user.id,
    action: nextStatus === "INACTIVE" ? "USER_DEACTIVATED" : "USER_ACTIVATED",
    summary:
      nextStatus === "INACTIVE" ? "کاربر غیرفعال شد" : "کاربر فعال شد",
    targetUserId: id,
  });
  revalidatePath("/users");
  revalidatePath("/admin");
  return { success: true };
}

export async function forceLogoutUser(id: string): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "غیرمجاز" };

  if (id === session.user.id) {
    return {
      success: false,
      error: "نمی‌توانید نشست خودتان را از اینجا قطع کنید؛ از خروج استفاده کنید",
    };
  }

  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!user) return { success: false, error: "کاربر یافت نشد" };
  if (user.role === "ADMIN") {
    return { success: false, error: "نمی‌توان نشست مدیر سیستم را قطع کرد" };
  }

  await revokeUserSessions(id);
  await writeAdminAudit({
    actorId: session.user.id,
    action: "FORCE_LOGOUT",
    summary: "نشست کاربر قطع شد",
    targetUserId: id,
  });
  revalidatePath("/users");
  revalidatePath("/admin");
  return { success: true };
}

export async function listUserLoginEventsAction(userId: string): Promise<{
  success: boolean;
  events: Array<{
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    createdAt: string;
    ip: string | null;
    userAgent: string | null;
  }>;
  error?: string;
}> {
  const session = await requireAdminSession();
  if (!session) return { success: false, events: [], error: "غیرمجاز" };

  const { getUserLoginEvents } = await import("@/features/users/queries");
  const rows = await getUserLoginEvents(userId, 20);
  return {
    success: true,
    events: rows.map(r => ({
      ...r,
      createdAt:
        r.createdAt instanceof Date
          ? r.createdAt.toISOString()
          : String(r.createdAt),
    })),
  };
}

export async function deleteUser(id: string): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "غیرمجاز" };

  if (id === session.user.id) {
    return { success: false, error: "شما نمی‌توانید حساب کاربری خود را حذف کنید" };
  }

  const user = await db.user.findUnique({
    where: { id },
    select: { role: true, name: true, email: true },
  });
  if (!user) return { success: false, error: "کاربر یافت نشد" };

  if (user.role === "ADMIN") {
    return { success: false, error: "نمی‌توان مدیر سیستم را حذف کرد" };
  }

  const personalTeamId = `personal-${id}`;

  try {
    await writeAdminAudit({
      actorId: session.user.id,
      action: "USER_DELETED",
      summary: `کاربر ${user.name} حذف شد`,
      targetUserId: null,
      meta: { deletedUserId: id, email: user.email },
    });
    await db.$transaction(async tx => {
      await tx.task.updateMany({
        where: { assignedToId: id },
        data: { assignedToId: null },
      });
      // Task.createdById has no onDelete cascade — must remove first.
      await tx.task.deleteMany({ where: { createdById: id } });

      await tx.project.deleteMany({ where: { teamId: personalTeamId } });
      await tx.projectMember.deleteMany({ where: { userId: id } });
      await tx.teamMember.deleteMany({ where: { userId: id } });
      await tx.team.deleteMany({ where: { id: personalTeamId } });

      await tx.user.delete({ where: { id } });
    });
  } catch (err) {
    console.error("[users] deleteUser failed", err);
    return {
      success: false,
      error: "حذف کاربر به‌خاطر داده‌های وابسته ممکن نشد",
    };
  }

  revalidatePath("/users");
  revalidatePath("/admin");
  return { success: true };
}

export async function resetUserPassword(id: string): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "غیرمجاز" };

  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) return { success: false, error: "کاربر یافت نشد" };

  // Admin must change their own password via profile (current password required).
  if (user.role === "ADMIN") {
    return {
      success: false,
      error: "برای تغییر رمز مدیر از صفحه پروفایل استفاده کنید",
    };
  }

  const tempPassword = generateTempPassword();
  const hashed = await bcrypt.hash(tempPassword, 12);
  await db.user.update({
    where: { id },
    data: {
      password: hashed,
      mustChangePassword: true,
      sessionVersion: { increment: 1 },
    },
  });
  await writeAdminAudit({
    actorId: session.user.id,
    action: "PASSWORD_RESET",
    summary: `رمز عبور ${user.name} بازنشانی شد`,
    targetUserId: id,
  });

  revalidatePath("/users");
  revalidatePath("/admin");
  return { success: true, data: { tempPassword } };
}

export async function uploadUserAvatar(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  if (id !== session.user.id && session.user.role !== "ADMIN") {
    return { success: false, error: "غیرمجاز" };
  }

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { success: false, error: "فایلی انتخاب نشده است" };
  if (!file.type.startsWith("image/")) return { success: false, error: "فایل باید تصویر باشد" };
  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: "تصویر باید کوچکتر از ۲ مگابایت باشد" };
  }

  const url = await uploadToStorage(file, id);
  if (!url) {
    return {
      success: false,
      error:
        "ذخیره‌سازی پیکربندی نشده است. متغیرهای محیطی S3 را برای فعال‌سازی آپلود عکس پروفایل اضافه کنید",
    };
  }

  await db.user.update({ where: { id }, data: { avatar: url } });
  revalidatePath("/users");
  revalidatePath("/admin");
  revalidatePath("/settings");
  return { success: true, data: { url } };
}

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const parsed = updateProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name },
  });
  revalidatePath("/settings");
  return { success: true };
}

export async function changePassword(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });
  if (!user?.password) return { success: false, error: "رمز عبوری برای این حساب تنظیم نشده است" };

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!valid) return { success: false, error: "رمز عبور فعلی اشتباه است" };

  const hashed = await bcrypt.hash(parsed.data.password, 12);
  await db.user.update({
    where: { id: session.user.id },
    data: { password: hashed, mustChangePassword: false },
  });
  revalidatePath("/", "layout");
  return { success: true };
}
