import { createWorkLog } from "@/features/work-logs/actions";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const result = await createWorkLog(formData);
  return NextResponse.json(result);
}