import { prisma as db } from "@/lib/db";
import type { GetUsersResult, UserRow } from "./types";

const PAGE_SIZE = 20;

export async function getUsers(
  search = "",
  page = 1
): Promise<GetUsersResult> {
  const skip = (page - 1) * PAGE_SIZE;
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

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
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    db.user.count({ where }),
  ]);

  return {
    users: users as UserRow[],
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getAllActiveUsers(): Promise<UserRow[]> {
  const users = await db.user.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      status: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });
  return users as UserRow[];
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
    },
  });
  return user as UserRow | null;
}
