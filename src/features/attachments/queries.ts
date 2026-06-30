import { prisma as db } from "@/lib/db";
import type { AttachmentRow } from "./types";

export async function getAttachments(taskId: string): Promise<AttachmentRow[]> {
  return db.attachment.findMany({
    where: { taskId },
    orderBy: { createdAt: "desc" },
    select: { id: true, url: true, filename: true, createdAt: true },
  });
}
