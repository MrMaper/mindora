import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import {
  getWorkLogsByTaskId,
  getTotalHoursByTask,
} from "@/features/work-logs/queries";
import { canAccessPersonalTask } from "@/lib/task-access";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const task = await db.task.findUnique({
    where: { id },
    select: { id: true, assignedToId: true, createdById: true },
  });
  if (!task) {
    return NextResponse.json(
      { success: false, error: "Not found" },
      { status: 404 },
    );
  }
  if (
    !canAccessPersonalTask(session.user.id, session.user.role, task)
  ) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  const [workLogs, totalHours] = await Promise.all([
    getWorkLogsByTaskId(id),
    getTotalHoursByTask(id),
  ]);

  return NextResponse.json({ success: true, data: { workLogs, totalHours } });
}
