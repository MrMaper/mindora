import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10", 10), 20);

  if (!query.trim() || query.length < 2) {
    return NextResponse.json({ tasks: [], users: [] });
  }

  try {
    const [tasks, users] = await Promise.all([
      db.task.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          projectId: true,
        },
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      db.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
          status: "ACTIVE",
          id: { not: session.user.id },
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
        take: limit,
      }),
    ]);

    return NextResponse.json({ tasks, users });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "جستجو ناموفق بود" }, { status: 500 });
  }
}