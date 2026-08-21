"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { uploadAvatar as uploadToStorage } from "@/lib/storage";
import { createUserSchema, updateUserSchema, updateProfileSchema } from "@/schemas/users";
import { changePasswordSchema } from "@/schemas/auth";

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pass = "Tmp@";
  for (let i = 0; i < 8; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  return pass;
}

async function requireAdminSession() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

// ─── Admin: create user ───────────────────────────────────────────────────

export async function createUser(formData: FormData): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "غیرمجاز" };

  const parsed = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { success: false, error: "کاربری با این ایمیل قبلاً وجود دارد" };

  const tempPassword = generateTempPassword();
  const hashed = await bcrypt.hash(tempPassword, 12);

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      password: hashed,
      status: "ACTIVE",
      ...(parsed.data.teamId && {
        teamMembers: {
          create: {
            teamId: parsed.data.teamId,
            roleId: (await db.role.findUnique({ where: { name: "MEMBER" } }))!.id,
          },
        },
      }),
    },
  });

  if (process.env.SMTP_HOST) {
    await sendMail({
      to: user.email,
      subject: "حساب کاربری ScrumFlow شما",
      html: `<p>سلام ${user.name}،</p><p>رمز عبور موقت شما: <strong>${tempPassword}</strong></p><p>لطفاً وارد شوید و رمز عبور را تغییر دهید.</p>`,
    });
  } else {
    console.log(`[users:dev] Temp password for ${user.email}: ${tempPassword}`);
  }

  revalidatePath("/users");
  return { success: true, data: { tempPassword } };
}

// ─── Admin: update user ───────────────────────────────────────────────────

export async function updateUser(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "غیرمجاز" };

  const parsed = updateUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  if (parsed.data.role === "MEMBER") {
    const target = await db.user.findUnique({ where: { id }, select: { role: true } });
    if (target?.role === "ADMIN") {
      const adminCount = await db.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return { success: false, error: "نمی‌توان آخرین مدیر را به عضو تبدیل کرد" };
      }
    }
  }

  // Handle team assignment
  const existingMembership = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId: parsed.data.teamId ?? "", userId: id } },
  });

  if (parsed.data.teamId) {
    const memberRole = await db.role.findUnique({ where: { name: "MEMBER" } });
    if (existingMembership) {
      // Update existing membership
      await db.teamMember.update({
        where: { id: existingMembership.id },
        data: { teamId: parsed.data.teamId },
      });
    } else {
      // Create new membership
      await db.teamMember.create({
        data: {
          userId: id,
          teamId: parsed.data.teamId,
          roleId: memberRole!.id,
        },
      });
    }
  } else if (existingMembership) {
    // Remove team membership if teamId is cleared
    await db.teamMember.delete({ where: { id: existingMembership.id } });
  }

  await db.user.update({
    where: { id },
    data: { name: parsed.data.name, role: parsed.data.role },
  });
  revalidatePath("/users");
  return { success: true };
}

// ─── Admin: toggle active / inactive ─────────────────────────────────────

export async function toggleUserStatus(id: string): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "غیرمجاز" };

  if (id === session.user.id) {
    return { success: false, error: "شما نمی‌توانید حساب کاربری خود را غیرفعال کنید" };
  }

  const user = await db.user.findUnique({ where: { id }, select: { status: true, role: true } });
  if (!user) return { success: false, error: "کاربر یافت نشد" };

  if (user.role === "ADMIN" && user.status === "ACTIVE") {
    const activeAdmins = await db.user.count({ where: { role: "ADMIN", status: "ACTIVE" } });
    if (activeAdmins <= 1) {
      return { success: false, error: "نمی‌توان آخرین مدیر فعال را غیرفعال کرد" };
    }
  }

  await db.user.update({
    where: { id },
    data: { status: user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
  });
  revalidatePath("/users");
  return { success: true };
}

// ─── Admin: delete user ───────────────────────────────────────────────────

export async function deleteUser(id: string): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "غیرمجاز" };

  if (id === session.user.id) {
    return { success: false, error: "شما نمی‌توانید حساب کاربری خود را حذف کنید" };
  }

  const user = await db.user.findUnique({ where: { id }, select: { role: true } });
  if (!user) return { success: false, error: "کاربر یافت نشد" };

  if (user.role === "ADMIN") {
    const adminCount = await db.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return { success: false, error: "نمی‌توان آخرین مدیر را حذف کرد" };
    }
  }

  await db.user.delete({ where: { id } });
  revalidatePath("/users");
  return { success: true };
}

// ─── Avatar upload (admin for others, any user for self) ─────────────────

export async function uploadUserAvatar(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  if (id !== session.user.id && session.user.role !== "ADMIN") {
    return { success: false, error: "غیرمجاز" };
  }

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { success: false, error: "فایلی انتخاب نشده است" };
  if (!file.type.startsWith("image/")) return { success: false, error: "فایل باید تصویر باشد" };
  if (file.size > 2 * 1024 * 1024) return { success: false, error: "تصویر باید کوچکتر از ۲ مگابایت باشد" };

  const url = await uploadToStorage(file, id);
  if (!url) {
    return { success: false, error: "ذخیره‌سازی پیکربندی نشده است. متغیرهای محیطی S3 را برای فعال‌سازی آپلود عکس پروفایل اضافه کنید" };
  }

  await db.user.update({ where: { id }, data: { avatar: url } });
  revalidatePath("/users");
  revalidatePath("/profile");
  return { success: true, data: { url } };
}

// ─── Own profile ──────────────────────────────────────────────────────────

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const parsed = updateProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  await db.user.update({ where: { id: session.user.id }, data: { name: parsed.data.name } });
  revalidatePath("/profile");
  return { success: true };
}

// ─── Change own password ──────────────────────────────────────────────────

export async function changePassword(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { password: true } });
  if (!user?.password) return { success: false, error: "رمز عبوری برای این حساب تنظیم نشده است" };

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!valid) return { success: false, error: "رمز عبور فعلی اشتباه است" };

  const hashed = await bcrypt.hash(parsed.data.password, 12);
  await db.user.update({ where: { id: session.user.id }, data: { password: hashed } });
  return { success: true };
}
