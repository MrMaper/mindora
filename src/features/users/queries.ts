import { prisma as db } from "@/lib/db";
import { parseModuleFlags } from "@/lib/modules";
import type { GetUsersResult, UserRow } from "./types";

const PAGE_SIZE = 15;

function mapUser(u: {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: UserRow["role"];
  status: UserRow["status"];
  createdAt: Date;
  enabledModules: unknown;
}): UserRow {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.avatar,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
    enabledModules: parseModuleFlags(u.enabledModules),
  };
}

export async function getUsers(
  search = "",
  page = 1,
  role = "",
  status = "",
  _teamId = "",
  sort = "createdAt",
  order = "desc",
): Promise<GetUsersResult> {
  const skip = (page - 1) * PAGE_SIZE;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role) where.role = role;
  if (status) where.status = status;

  const orderBy: Record<string, "asc" | "desc"> = {};
  const validSortFields = ["createdAt", "name", "email", "role", "status"];
  const sortField = validSortFields.includes(sort) ? sort : "createdAt";
  orderBy[sortField] = order === "asc" ? "asc" : "desc";

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        enabledModules: true,
      },
      orderBy,
      skip,
      take: PAGE_SIZE,
    }),
    db.user.count({ where }),
  ]);

  return {
    users: users.map(mapUser),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getAllActiveUsers(): Promise<UserRow[]> {
  const users = await db.user.findMany({
    where: { status: "ACTIVE", role: "MEMBER" },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      status: true,
      createdAt: true,
      enabledModules: true,
    },
    orderBy: { name: "asc" },
  });
  return users.map(mapUser);
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      status: true,
      createdAt: true,
      enabledModules: true,
    },
  });
  if (!user) return null;
  return mapUser(user);
}
