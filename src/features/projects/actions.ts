"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
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
import { personalAreaProjectId } from "@/lib/area-projects";
import { isAreaBucketId } from "@/lib/project-namespace";
import { ensurePersonalWorkspace } from "@/features/life/workspace";
import { LIFE_AREAS } from "@/lib/life";
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

  const maxSort = await db.project.aggregate({
    where: {
      area,
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
      area,
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
  revalidatePath(`/projects/areas/${area}`);
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
  revalidatePath(`/projects/areas/${area}`);
  revalidatePath("/tasks");
  revalidatePath("/kanban");
  revalidatePath("/dashboard");
  return { success: true };
}

function revalidateAreaSurfaces(area?: LifeArea) {
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  if (area) {
    revalidatePath(`/projects/areas/${area}`);
    if (area === "PHD") revalidatePath("/research");
    if (area === "LANG") revalidatePath("/language");
  }
}

// ─── Area preference (color / icon / archive / sort) ─────────────────────────

export async function updateAreaPreference(
  input: unknown,
): Promise<ActionResult> {
  const session = await requireAuth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const parsed = updateAreaPreferenceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const { area, color, icon, sortOrder, archived } = parsed.data;
  await ensurePersonalWorkspace(session.user.id);

  await db.userAreaPreference.upsert({
    where: {
      userId_area: { userId: session.user.id, area },
    },
    create: {
      userId: session.user.id,
      area,
      color: color === undefined ? null : color,
      icon: icon === undefined ? null : icon,
      sortOrder: sortOrder ?? LIFE_AREAS.indexOf(area),
      archived: archived ?? false,
    },
    update: {
      ...(color !== undefined ? { color } : {}),
      ...(icon !== undefined ? { icon } : {}),
      ...(sortOrder !== undefined ? { sortOrder } : {}),
      ...(archived !== undefined ? { archived } : {}),
    },
  });

  revalidateAreaSurfaces(area);
  return { success: true };
}

export async function reorderAreas(orderedAreas: LifeArea[]): Promise<ActionResult> {
  const session = await requireAuth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const parsed = reorderAreasSchema.safeParse({ orderedAreas });
  if (!parsed.success) {
    return { success: false, error: "ترتیب حوزه‌ها نامعتبر است" };
  }

  const unique = new Set(parsed.data.orderedAreas);
  if (unique.size !== 4 || !LIFE_AREAS.every(a => unique.has(a))) {
    return { success: false, error: "ترتیب حوزه‌ها نامعتبر است" };
  }

  await ensurePersonalWorkspace(session.user.id);

  await db.$transaction(
    parsed.data.orderedAreas.map((area, index) =>
      db.userAreaPreference.upsert({
        where: {
          userId_area: { userId: session.user.id, area },
        },
        create: {
          userId: session.user.id,
          area,
          sortOrder: index,
        },
        update: { sortOrder: index },
      }),
    ),
  );

  revalidateAreaSurfaces();
  return { success: true };
}

export async function reorderPathsInArea(
  area: LifeArea,
  orderedIds: string[],
): Promise<ActionResult> {
  const session = await requireAuth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const parsed = reorderPathsSchema.safeParse({ area, orderedIds });
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
      project: { area },
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

  revalidateAreaSurfaces(area);
  return { success: true };
}

export async function movePathToArea(input: {
  pathId: string;
  toArea: LifeArea;
  toIndex?: number;
}): Promise<ActionResult> {
  const session = await requireAuth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const parsed = movePathSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const { pathId, toArea, toIndex } = parsed.data;
  if (isAreaBucketId(pathId)) {
    return { success: false, error: "Cannot move area buckets" };
  }

  const isAdmin = await requireProjectAdmin(pathId, session.user.id);
  if (!isAdmin) return { success: false, error: "اجازه جابه‌جایی ندارید" };

  const existing = await db.project.findUnique({
    where: { id: pathId },
    select: { area: true },
  });
  if (!existing) return { success: false, error: "مسیر پیدا نشد" };

  const fromArea = existing.area;

  let sortOrder = toIndex;
  if (sortOrder === undefined) {
    const maxSort = await db.project.aggregate({
      where: {
        area: toArea,
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
      data: { area: toArea, sortOrder },
    }),
    db.task.updateMany({
      where: { projectId: pathId },
      data: { area: toArea },
    }),
  ]);

  revalidateAreaSurfaces(fromArea);
  revalidateAreaSurfaces(toArea);
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
    select: { area: true },
  });

  revalidateAreaSurfaces(project.area);
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

  const activeTasks = await db.task.count({
    where: { projectId: id, status: { not: "DONE" } },
  });
  if (activeTasks > 0) {
    return { success: false, error: `نمی‌توان مسیری با ${activeTasks} کار فعال را حذف کرد` };
  }

  await db.project.delete({ where: { id } });

  revalidatePath("/projects");
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
