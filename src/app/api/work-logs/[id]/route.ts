import { updateWorkLog } from "@/features/work-logs/actions";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const formData = await request.formData();
  formData.append("id", id);
  const result = await updateWorkLog(formData);
  return NextResponse.json(result);
}