"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import { createTeamSchema, updateTeamSchema, archiveTeamSchema, deleteTeamSchema } from "@/schemas/teams";
import { inviteMemberSchema, updateMemberRoleSchema, removeMemberSchema } from "@/schemas/team-members";

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

// ─── Admin: create team ──────────────────────────────────────────────────────

export async function createTeam(formData: FormData): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "غیرمجاز" };

  const parsed = createTeamSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  // Get default organization (first one)
  const org = await db.organization.findFirst();
  if (!org) return { success: false, error: "سازمانی یافت نشد" };

  // Get ADMINISTRATOR role
  const adminRole = await db.role.findUnique({ where: { name: "ADMINISTRATOR" } });
  if (!adminRole) return { success: false, error: "نقش مدیر یافت نشد" };

  const team = await db.team.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      organizationId: org.id,
      members: {
        create: {
          userId: session.user.id,
          roleId: adminRole.id,
        },
      },
    },
  });

  revalidatePath("/teams");
  return { success: true, data: { teamId: team.id } };
}

// ─── Admin: update team ──────────────────────────────────────────────────────

export async function updateTeam(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "غیرمجاز" };

  const parsed = updateTeamSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  // Check if user is admin of this team
  const membership = await db.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId: id,
        userId: session.user.id,
      },
    },
    select: { role: { select: { name: true } } },
  });

  if (!membership || membership.role.name !== "ADMINISTRATOR") {
    return { success: false, error: "تنها مدیران تیم می‌توانند این تیم را به‌روزرسانی کنند" };
  }

  await db.team.update({
    where: { id },
    data: { name: parsed.data.name, description: parsed.data.description },
  });

  revalidatePath("/teams");
  return { success: true };
}

// ─── Admin: archive team ─────────────────────────────────────────────────────

export async function archiveTeam(id: string): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "غیرمجاز" };

  const parsed = archiveTeamSchema.safeParse({ id });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  // Check if user is admin of this team
  const membership = await db.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId: id,
        userId: session.user.id,
      },
    },
    select: { role: { select: { name: true } } },
  });

  if (!membership || membership.role.name !== "ADMINISTRATOR") {
    return { success: false, error: "تنها مدیران تیم می‌توانند این تیم را بایگانی کنند" };
  }

  // Soft archive - we could add an archivedAt field or status field to Team model
  // For now, we'll just delete (hard delete) since there's no archive field
  // This would need a schema change to support proper soft archive
  await db.team.update({
    where: { id },
    data: { name: `[Archived] ${(await db.team.findUnique({ where: { id }, select: { name: true } }))?.name ?? "Team"}` },
  });

  revalidatePath("/teams");
  return { success: true };
}

// ─── Admin: delete team ──────────────────────────────────────────────────────

export async function deleteTeam(id: string): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "غیرمجاز" };

  const parsed = deleteTeamSchema.safeParse({ id });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  // Check if user is admin of this team
  const membership = await db.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId: id,
        userId: session.user.id,
      },
    },
    select: { role: { select: { name: true } } },
  });

  if (!membership || membership.role.name !== "ADMINISTRATOR") {
    return { success: false, error: "تنها مدیران تیم می‌توانند این تیم را حذف کنند" };
  }

  // Guard: check for active tasks
  const activeTasks = await db.task.count({
    where: { teamId: id, status: { not: "DONE" } },
  });
  if (activeTasks > 0) {
    return { success: false, error: `نمی‌توان تیمی با ${activeTasks} کار فعال را حذف کرد` };
  }

  // Guard: check for members
  const memberCount = await db.teamMember.count({ where: { teamId: id } });
  if (memberCount > 0) {
    return { success: false, error: `نمی‌توان تیمی با ${memberCount} عضو را حذف کرد` };
  }

  await db.team.delete({ where: { id } });

  revalidatePath("/teams");
  return { success: true };
}

// ─── Member: invite ──────────────────────────────────────────────────────────

export async function inviteMember(
  teamId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const parsed = inviteMemberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  // Check caller is admin or team lead
  const caller = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
    select: { role: { select: { name: true } } },
  });
  if (!caller || (caller.role.name !== "ADMINISTRATOR" && caller.role.name !== "TEAM_LEAD")) {
    return { success: false, error: "شما مجوز دعوت عضو ندارید" };
  }

  // Check user is not already a member
  const existing = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: parsed.data.userId } },
  });
  if (existing) {
    return { success: false, error: "کاربر قبلاً عضو این تیم است" };
  }

  await db.teamMember.create({
    data: {
      teamId,
      userId: parsed.data.userId,
      roleId: parsed.data.roleId,
    },
  });

  revalidatePath(`/teams/${teamId}`);
  return { success: true };
}

// ─── Member: update role ─────────────────────────────────────────────────────

export async function updateMemberRole(
  memberId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const parsed = updateMemberRoleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const member = await db.teamMember.findUnique({
    where: { id: memberId },
    select: {
      teamId: true,
      userId: true,
      role: { select: { name: true } },
    },
  });
  if (!member) return { success: false, error: "عضو یافت نشد" };

  // Caller must be ADMINISTRATOR to change roles
  const caller = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId: member.teamId, userId: session.user.id } },
    select: { role: { select: { name: true } } },
  });
  if (!caller || caller.role.name !== "ADMINISTRATOR") {
    return { success: false, error: "تنها مدیران می‌توانند نقش اعضا را تغییر دهند" };
  }

  // Guard: prevent changing the last ADMINISTRATOR's role
  if (member.role.name === "ADMINISTRATOR") {
    const adminCount = await db.teamMember.count({
      where: { teamId: member.teamId, role: { name: "ADMINISTRATOR" } },
    });
    if (adminCount <= 1) {
      return { success: false, error: "نمی‌توان نقش آخرین مدیر را تغییر داد" };
    }
  }

  await db.teamMember.update({
    where: { id: memberId },
    data: { roleId: parsed.data.roleId },
  });

  revalidatePath(`/teams/${member.teamId}`);
  return { success: true };
}

// ─── Member: remove ──────────────────────────────────────────────────────────

export async function removeMember(memberId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const member = await db.teamMember.findUnique({
    where: { id: memberId },
    select: {
      teamId: true,
      userId: true,
      role: { select: { name: true } },
    },
  });
  if (!member) return { success: false, error: "عضو یافت نشد" };

  // Caller must be ADMINISTRATOR or TEAM_LEAD
  const caller = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId: member.teamId, userId: session.user.id } },
    select: { role: { select: { name: true } } },
  });
  if (!caller || (caller.role.name !== "ADMINISTRATOR" && caller.role.name !== "TEAM_LEAD")) {
    return { success: false, error: "شما مجوز حذف اعضا را ندارید" };
  }

  // Guard: prevent removing the last ADMINISTRATOR
  if (member.role.name === "ADMINISTRATOR") {
    const adminCount = await db.teamMember.count({
      where: { teamId: member.teamId, role: { name: "ADMINISTRATOR" } },
    });
    if (adminCount <= 1) {
      return { success: false, error: "نمی‌توان آخرین مدیر را حذف کرد" };
    }
  }

  // Guard: prevent removing the last TEAM_LEAD
  if (member.role.name === "TEAM_LEAD") {
    const leadCount = await db.teamMember.count({
      where: { teamId: member.teamId, role: { name: "TEAM_LEAD" } },
    });
    if (leadCount <= 1) {
      return { success: false, error: "نمی‌توان آخرین رهبر تیم را حذف کرد" };
    }
  }

  // Cannot remove yourself
  if (member.userId === session.user.id) {
    return { success: false, error: "شما نمی‌توانید خود را از تیم حذف کنید" };
  }

  await db.teamMember.delete({ where: { id: memberId } });

  revalidatePath(`/teams/${member.teamId}`);
  return { success: true };
}