"use server";

import { revalidatePath } from "next/cache";
import { authForModule } from "@/lib/module-guard";
import { prisma as db } from "@/lib/db";
import {
  createProjectSchema,
  updateProjectSchema,
  updateAreaBucketSchema,
  updateAreaPreferenceSchema,
  reorderAreasSchema,
  reorderPathsSchema,
  movePathSchema,
  togglePinSchema,
  archiveProjectSchema,
  deleteProjectSchema,
} from "@/schemas/projects";
import { isAreaBucketId } from "@/lib/project-namespace";
import { ensurePersonalWorkspace, bucketProjectIdForArea } from "@/features/life/workspace";
import {
  reorderUserAreasAction,
  updateUserAreaAction,
} from "@/features/projects/area-actions";

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

async function requireAuth() {
  return authForModule("projects");
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

  const { name, description, teamId } = parsed.data;

  // Never create a project with a reserved area-bucket id
  if (isAreaBucketId(name)) {
    return { success: false, error: "Invalid project name" };
  }

  await ensurePersonalWorkspace(session.user.id);

  const area = await db.userArea.findFirst({
    where: { id: parsed.data.areaId, userId: session.user.id, archived: false },
    select: { id: true },
  });
  if (!area) return { success: false, error: "حوزه پیدا نشد" };
  const areaId = area.id;

  const maxSort = await db.project.aggregate({
    where: {
      areaId,
      members: { some: { userId: session.user.id } },
      id: { not: { startsWith: "area-" } },
    },
    _max: { sortOrder: true },
  });

  const org = await db.organization.findFirst();
  if (!org) return { success: false, error: "Organization not found" };

  const project = await db.project.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      status: "ACTIVE",
      areaId,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
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
  await revalidateAreaSurfaces(areaId);
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

  const { areaId, name, description } = parsed.data;

  await ensurePersonalWorkspace(session.user.id);
  const area = await db.userArea.findFirst({
    where: { id: areaId, userId: session.user.id },
    select: { bucketProjectId: true },
  });
  const bucketId = area?.bucketProjectId;
  if (!bucketId) return { success: false, error: "حوزه پیدا نشد" };

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
  revalidatePath(`/projects/areas/${areaId}`);
  revalidatePath("/tasks");
  revalidatePath("/kanban");
  revalidatePath("/dashboard");
  return { success: true };
}

async function revalidateAreaSurfaces(areaId?: string) {
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  if (!areaId) return;
  revalidatePath(`/projects/areas/${areaId}`);
  const area = await db.userArea.findUnique({
    where: { id: areaId },
    select: { hubFor: true },
  });
  if (area?.hubFor === "RESEARCH") revalidatePath("/research");
  if (area?.hubFor === "LANGUAGE") revalidatePath("/language");
}

// ─── Area preference (color / icon / archive) ────────────────────────────────

export async function updateAreaPreference(
  input: unknown,
): Promise<ActionResult> {
  const session = await requireAuth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const parsed = updateAreaPreferenceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const { areaId, color, icon, archived } = parsed.data;
  await ensurePersonalWorkspace(session.user.id);
  return updateUserAreaAction({ areaId, color, icon, archived });
}

/** Reorder the member's areas by UserArea id. */
export async function reorderAreas(orderedIds: string[]): Promise<ActionResult> {
  const session = await requireAuth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const parsed = reorderAreasSchema.safeParse({ orderedIds });
  if (!parsed.success) {
    return { success: false, error: "ترتیب حوزه‌ها نامعتبر است" };
  }
  await ensurePersonalWorkspace(session.user.id);
  return reorderUserAreasAction(parsed.data.orderedIds);
}

export async function reorderPathsInArea(
  areaId: string,
  orderedIds: string[],
): Promise<ActionResult> {
  const session = await requireAuth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const parsed = reorderPathsSchema.safeParse({ areaId, orderedIds });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  if (parsed.data.orderedIds.some(isAreaBucketId)) {
    return { success: false, error: "Cannot reorder area buckets" };
  }

  const memberships = await db.projectMember.findMany({
    where: {
      userId: session.user.id,
      projectId: { in: parsed.data.orderedIds },
      project: { areaId: parsed.data.areaId },
    },
    select: { projectId: true },
  });
  if (memberships.length !== parsed.data.orderedIds.length) {
    return { success: false, error: "دسترسی به بعضی مسیرها ندارید" };
  }

  await db.$transaction(
    parsed.data.orderedIds.map((id, index) =>
      db.project.update({
        where: { id },
        data: { sortOrder: index },
      }),
    ),
  );

  await revalidateAreaSurfaces(parsed.data.areaId);
  return { success: true };
}

export async function movePathToArea(input: {
  pathId: string;
  toAreaId: string;
  toIndex?: number;
}): Promise<ActionResult> {
  const session = await requireAuth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const parsed = movePathSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const { pathId, toIndex } = parsed.data;
  if (isAreaBucketId(pathId)) {
    return { success: false, error: "Cannot move area buckets" };
  }

  const target = await db.userArea.findFirst({
    where: { id: parsed.data.toAreaId, userId: session.user.id },
    select: { id: true },
  });
  if (!target) return { success: false, error: "حوزه پیدا نشد" };
  const toAreaId = target.id;

  const isAdmin = await requireProjectAdmin(pathId, session.user.id);
  if (!isAdmin) return { success: false, error: "اجازه جابه‌جایی ندارید" };

  const existing = await db.project.findUnique({
    where: { id: pathId },
    select: { areaId: true },
  });
  if (!existing) return { success: false, error: "مسیر پیدا نشد" };

  const fromAreaId = existing.areaId;

  let sortOrder = toIndex;
  if (sortOrder === undefined) {
    const maxSort = await db.project.aggregate({
      where: {
        areaId: toAreaId,
        members: { some: { userId: session.user.id } },
        id: { not: { startsWith: "area-" } },
      },
      _max: { sortOrder: true },
    });
    sortOrder = (maxSort._max.sortOrder ?? -1) + 1;
  }

  await db.$transaction([
    db.project.update({
      where: { id: pathId },
      data: { areaId: toAreaId, sortOrder },
    }),
    db.task.updateMany({
      where: { projectId: pathId },
      data: { areaId: toAreaId },
    }),
    db.doc.updateMany({
      where: { projectId: pathId, deletedAt: null },
      data: { areaId: toAreaId },
    }),
  ]);

  await revalidateAreaSurfaces(fromAreaId);
  await revalidateAreaSurfaces(toAreaId);
  revalidatePath(`/projects/${pathId}`);
  revalidatePath("/tasks");
  revalidatePath("/kanban");
  revalidatePath("/calendar");
  return { success: true };
}

export async function togglePathPin(
  pathId: string,
  pinned: boolean,
): Promise<ActionResult> {
  const session = await requireAuth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const parsed = togglePinSchema.safeParse({ pathId, pinned });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }
  if (isAreaBucketId(pathId)) {
    return { success: false, error: "Cannot pin area buckets" };
  }

  const isAdmin = await requireProjectAdmin(pathId, session.user.id);
  if (!isAdmin) return { success: false, error: "اجازه پین ندارید" };

  const project = await db.project.update({
    where: { id: pathId },
    data: { pinned },
    select: { areaId: true },
  });

  await revalidateAreaSurfaces(project.areaId);
  revalidatePath(`/projects/${pathId}`);
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
  if (!isAdmin) return { success: false, error: "فقط مدیران مسیر می‌توانند این مسیر را به‌روزرسانی کنند" };

  const parsed = updateProjectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const existing = await db.project.findUnique({
    where: { id },
    select: { areaId: true },
  });
  if (!existing) {
    return { success: false, error: "مسیر پیدا نشد" };
  }

  const updateData: {
    name: string;
    description?: string;
    status?: (typeof parsed.data)["status"];
    areaId?: string;
    sortOrder?: number;
  } = {
    name: parsed.data.name,
    description: parsed.data.description,
    ...(parsed.data.status && { status: parsed.data.status }),
  };

  let fromAreaId = existing.areaId;
  let toAreaId = existing.areaId;

  if (parsed.data.areaId && parsed.data.areaId !== existing.areaId) {
    const target = await db.userArea.findFirst({
      where: { id: parsed.data.areaId, userId: session.user.id },
      select: { id: true },
    });
    if (!target) return { success: false, error: "حوزه پیدا نشد" };

    toAreaId = target.id;
    const maxSort = await db.project.aggregate({
      where: {
        areaId: toAreaId,
        members: { some: { userId: session.user.id } },
        id: { not: { startsWith: "area-" } },
      },
      _max: { sortOrder: true },
    });
    updateData.areaId = toAreaId;
    updateData.sortOrder = (maxSort._max.sortOrder ?? -1) + 1;
  }

  if (toAreaId !== fromAreaId) {
    await db.$transaction([
      db.project.update({
        where: { id },
        data: updateData,
      }),
      db.task.updateMany({
        where: { projectId: id },
        data: { areaId: toAreaId },
      }),
      db.doc.updateMany({
        where: { projectId: id, deletedAt: null },
        data: { areaId: toAreaId },
      }),
    ]);
    await revalidateAreaSurfaces(fromAreaId);
    await revalidateAreaSurfaces(toAreaId);
    revalidatePath("/tasks");
    revalidatePath("/kanban");
    revalidatePath("/calendar");
  } else {
    await db.project.update({
      where: { id },
      data: updateData,
    });
    await revalidateAreaSurfaces(fromAreaId);
  }

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
  if (!isAdmin) return { success: false, error: "فقط مدیران مسیر می‌توانند این مسیر را بایگانی کنند" };

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
  if (!isAdmin) return { success: false, error: "فقط مدیران مسیر می‌توانند این مسیر را بازگردانند" };

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
  if (!isOwner) return { success: false, error: "فقط مالک مسیر می‌تواند این مسیر را حذف کند" };

  const parsed = deleteProjectSchema.safeParse({ id });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const project = await db.project.findUnique({
    where: { id },
    select: { areaId: true },
  });
  if (!project) return { success: false, error: "مسیر پیدا نشد" };

  const activeTasks = await db.task.count({
    where: { projectId: id, status: { not: "DONE" } },
  });
  if (activeTasks > 0) {
    return { success: false, error: `نمی‌توان مسیری با ${activeTasks} کار فعال را حذف کرد` };
  }

  // DONE (and any leftover) rows keep continuity — rehome to the area bucket
  // so FKs do not block delete and research library is not orphaned.
  const bucketId = await bucketProjectIdForArea(session.user.id, project.areaId);
  await db.$transaction([
    db.task.updateMany({
      where: { projectId: id },
      data: { projectId: bucketId },
    }),
    db.doc.updateMany({
      where: { projectId: id },
      data: { projectId: bucketId },
    }),
    db.docSource.updateMany({
      where: { projectId: id },
      data: { projectId: bucketId },
    }),
    db.langCard.updateMany({
      where: { projectId: id },
      data: { projectId: bucketId },
    }),
    db.langSession.updateMany({
      where: { projectId: id },
      data: { projectId: bucketId },
    }),
    db.langListeningClip.updateMany({
      where: { projectId: id },
      data: { projectId: bucketId },
    }),
    db.examTrack.updateMany({
      where: { projectId: id },
      data: { projectId: bucketId },
    }),
    db.mockAttempt.updateMany({
      where: { projectId: id },
      data: { projectId: bucketId },
    }),
    db.project.delete({ where: { id } }),
  ]);

  revalidatePath("/projects");
  revalidatePath("/research");
  revalidatePath("/docs");
  return { success: true };
}

// ─── Member: invite ────────────────────────────────────────────────────────

export async function inviteMember(
  _projectId: string,
  _formData: FormData
): Promise<ActionResult> {
  const session = await requireAuth();
  if (!session) return { success: false, error: "غیرمجاز" };

  // Personal Life OS: workspaces are private — no cross-user project invites.
  return {
    success: false,
    error: "دعوت عضو در فضای شخصی غیرفعال است",
  };
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
  if (!isOwner) return { success: false, error: "فقط مالک مسیر می‌تواند نقش اعضا را تغییر دهد" };

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
    return { success: false, error: "نمی‌توانی خودت را از مسیر حذف کنی" };
  }

  await db.projectMember.delete({ where: { id: memberId } });

  revalidatePath("/projects");
  revalidatePath(`/projects/${member.projectId}`);
  return { success: true };
}
