"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import {
  createProjectSchema,
  updateProjectSchema,
  updateAreaBucketSchema,
  archiveProjectSchema,
  deleteProjectSchema,
} from "@/schemas/projects";
import { personalAreaProjectId } from "@/lib/area-projects";
import { isAreaBucketId } from "@/lib/project-namespace";
import { ensurePersonalWorkspace } from "@/features/life/workspace";
import type { LifeArea } from "@/types/db";

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

async function requireAuth() {
  const session = await auth();
  if (!session?.user) return null;
  return session;
}

async function requireProjectAdmin(projectId: string, userId: string) {
  const membership = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { role: true },
  });
  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    return false;
  }
  return true;
}

async function requireProjectOwner(projectId: string, userId: string) {
  const membership = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { role: true },
  });
  if (!membership || membership.role !== "OWNER") {
    return false;
  }
  return true;
}

// ─── Create path (named project under an area) ───────────────────────────────

export async function createProject(formData: FormData): Promise<ActionResult> {
  const session = await requireAuth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const parsed = createProjectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const { name, description, teamId, area } = parsed.data;

  // Never create a project with a reserved area-bucket id
  if (isAreaBucketId(name)) {
    return { success: false, error: "Invalid project name" };
  }

  await ensurePersonalWorkspace(session.user.id);

  const org = await db.organization.findFirst();
  if (!org) return { success: false, error: "Organization not found" };

  const project = await db.project.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      status: "ACTIVE",
      area,
      members: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
      ...(teamId ? { teamId } : {}),
    },
  });

  revalidatePath("/projects");
  if (area === "PHD") revalidatePath("/research");
  if (area === "LANG") revalidatePath("/language");
  return { success: true, data: { projectId: project.id } };
}

// ─── Update area bucket (name + description only) ────────────────────────────

export async function updateAreaBucket(formData: FormData): Promise<ActionResult> {
  const session = await requireAuth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const parsed = updateAreaBucketSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const { area, name, description } = parsed.data;
  const bucketId = personalAreaProjectId(session.user.id, area as LifeArea);

  await ensurePersonalWorkspace(session.user.id);

  const isAdmin = await requireProjectAdmin(bucketId, session.user.id);
  if (!isAdmin) {
    return { success: false, error: "Only area owners can edit this area" };
  }

  await db.project.update({
    where: { id: bucketId },
    data: {
      name: name.trim(),
      description: description?.trim() || null,
    },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${bucketId}`);
  revalidatePath("/tasks");
  revalidatePath("/kanban");
  revalidatePath("/dashboard");
  return { success: true };
}

// ─── Update named path ───────────────────────────────────────────────────────

export async function updateProject(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireAuth();
  if (!session) return { success: false, error: "غیرمجاز" };

  if (isAreaBucketId(id)) {
    return {
      success: false,
      error: "Area buckets must be edited via updateAreaBucket",
    };
  }

  const isAdmin = await requireProjectAdmin(id, session.user.id);
  if (!isAdmin) return { success: false, error: "تنها مدیران پروژه می‌توانند این پروژه را به‌روزرسانی کنند" };

  const parsed = updateProjectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  await db.project.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      ...(parsed.data.status && { status: parsed.data.status }),
    },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { success: true };
}

// ─── Archive project ────────────────────────────────────────────────────────

export async function archiveProject(id: string): Promise<ActionResult> {
  const session = await requireAuth();
  if (!session) return { success: false, error: "غیرمجاز" };

  if (isAreaBucketId(id)) {
    return { success: false, error: "Area buckets cannot be archived" };
  }

  const isAdmin = await requireProjectAdmin(id, session.user.id);
  if (!isAdmin) return { success: false, error: "تنها مدیران پروژه می‌توانند این پروژه را بایگانی کنند" };

  const parsed = archiveProjectSchema.safeParse({ id });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  await db.project.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { success: true };
}

// ─── Unarchive project ───────────────────────────────────────────────────────

export async function unarchiveProject(id: string): Promise<ActionResult> {
  const session = await requireAuth();
  if (!session) return { success: false, error: "غیرمجاز" };

  if (isAreaBucketId(id)) {
    return { success: false, error: "Area buckets cannot be archived" };
  }

  const isAdmin = await requireProjectAdmin(id, session.user.id);
  if (!isAdmin) return { success: false, error: "تنها مدیران پروژه می‌توانند این پروژه را بازگردانند" };

  const parsed = archiveProjectSchema.safeParse({ id });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  await db.project.update({
    where: { id },
    data: { status: "ACTIVE" },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { success: true };
}

// ─── Delete project ────────────────────────────────────────────────────────

export async function deleteProject(id: string): Promise<ActionResult> {
  const session = await requireAuth();
  if (!session) return { success: false, error: "غیرمجاز" };

  if (isAreaBucketId(id)) {
    return { success: false, error: "Area buckets cannot be deleted" };
  }

  const isOwner = await requireProjectOwner(id, session.user.id);
  if (!isOwner) return { success: false, error: "تنها مالک پروژه می‌تواند این پروژه را حذف کند" };

  const parsed = deleteProjectSchema.safeParse({ id });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const activeTasks = await db.task.count({
    where: { projectId: id, status: { not: "DONE" } },
  });
  if (activeTasks > 0) {
    return { success: false, error: `نمی‌توان پروژه‌ای با ${activeTasks} تسک فعال را حذف کرد` };
  }

  await db.project.delete({ where: { id } });

  revalidatePath("/projects");
  return { success: true };
}

// ─── Member: invite ────────────────────────────────────────────────────────

export async function inviteMember(
  projectId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireAuth();
  if (!session) return { success: false, error: "غیرمجاز" };

  const isAdmin = await requireProjectAdmin(projectId, session.user.id);
  if (!isAdmin) return { success: false, error: "شما مجوز دعوت عضو ندارید" };

  const { userId, role } = Object.fromEntries(formData) as { userId: string; role: string };

  const existing = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (existing) {
    return { success: false, error: "کاربر قبلاً عضو این پروژه است" };
  }

  await db.projectMember.create({
    data: { projectId, userId, role: role as "OWNER" | "ADMIN" | "MEMBER" | "VIEWER" },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

// ─── Member: update role ───────────────────────────────────────────────────

export async function updateMemberRole(
  memberId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireAuth();
  if (!session) return { success: false, error: "غیرمجاز" };

  const { role } = Object.fromEntries(formData) as { role: string };

  const member = await db.projectMember.findUnique({
    where: { id: memberId },
    select: { projectId: true, userId: true, role: true },
  });
  if (!member) return { success: false, error: "عضو یافت نشد" };

  const isOwner = await requireProjectOwner(member.projectId, session.user.id);
  if (!isOwner) return { success: false, error: "تنها مالک پروژه می‌تواند نقش اعضا را تغییر دهد" };

  if (member.role === "OWNER") {
    const ownerCount = await db.projectMember.count({
      where: { projectId: member.projectId, role: "OWNER" },
    });
    if (ownerCount <= 1) {
      return { success: false, error: "نمی‌توان نقش آخرین مالک را تغییر داد" };
    }
  }

  await db.projectMember.update({
    where: { id: memberId },
    data: { role: role as "OWNER" | "ADMIN" | "MEMBER" | "VIEWER" },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${member.projectId}`);
  return { success: true };
}

// ─── Member: remove ────────────────────────────────────────────────────────

export async function removeMember(memberId: string): Promise<ActionResult> {
  const session = await requireAuth();
  if (!session) return { success: false, error: "غیرمجاز" };

  const member = await db.projectMember.findUnique({
    where: { id: memberId },
    select: { projectId: true, userId: true, role: true },
  });
  if (!member) return { success: false, error: "عضو یافت نشد" };

  const isAdmin = await requireProjectAdmin(member.projectId, session.user.id);
  if (!isAdmin) return { success: false, error: "شما مجوز حذف اعضا را ندارید" };

  if (member.role === "OWNER") {
    const ownerCount = await db.projectMember.count({
      where: { projectId: member.projectId, role: "OWNER" },
    });
    if (ownerCount <= 1) {
      return { success: false, error: "نمی‌توان آخرین مالک را حذف کرد" };
    }
  }

  if (member.userId === session.user.id) {
    return { success: false, error: "شما نمی‌توانید خود را از پروژه حذف کنید" };
  }

  await db.projectMember.delete({ where: { id: memberId } });

  revalidatePath("/projects");
  revalidatePath(`/projects/${member.projectId}`);
  return { success: true };
}
