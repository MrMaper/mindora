import { prisma as db } from "@/lib/db";
import type { CommentRow } from "./types";

export async function getComments(taskId: string): Promise<CommentRow[]> {
  const comments = await db.comment.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { id: true, name: true, avatar: true } },
    },
  });

  return comments.map(c => ({
    id: c.id,
    body: c.body,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    edited: c.updatedAt.getTime() - c.createdAt.getTime() > 1000,
    user: c.user,
  }));
}
