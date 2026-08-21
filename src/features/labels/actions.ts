"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import { createLabelSchema } from "@/schemas/tasks";

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

export async function createLabel(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin) return { success: false, error: "فقط ادمین می‌تواند برچسب ایجاد کند" };

  const parsed = createLabelSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const existing = await db.label.findFirst({ where: { name: parsed.data.name } });
  if (existing) return { success: false, error: "برچسبی با این نام قبلاً وجود دارد" };

  const label = await db.label.create({
    data: { name: parsed.data.name, color: parsed.data.color },
  });

  revalidatePath("/tasks");
  return { success: true, data: { id: label.id } };
}

export async function deleteLabel(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin) return { success: false, error: "فقط ادمین می‌تواند برچسب حذف کند" };

  await db.label.delete({ where: { id } });
  revalidatePath("/tasks");
  return { success: true };
}
