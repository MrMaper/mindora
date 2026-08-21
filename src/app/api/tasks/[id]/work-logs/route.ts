import { auth } from "@/auth";
import { getWorkLogsByTaskId, getTotalHoursByTask } from "@/features/work-logs/queries";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [workLogs, totalHours] = await Promise.all([
    getWorkLogsByTaskId(id),
    getTotalHoursByTask(id),
  ]);

  return NextResponse.json({ success: true, data: { workLogs, totalHours } });
}