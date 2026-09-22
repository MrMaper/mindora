import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import { taskWhereExcludeHub } from "@/lib/project-namespace";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });
  }

  const uid = session.user.id;
  const searchParams = request.nextUrl.searchParams;
  const query = (searchParams.get("q") ?? "").trim();
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "8", 10), 15);

  if (!query || query.length < 2) {
    return NextResponse.json({
      tasks: [],
      docs: [],
      projects: [],
      users: [],
      vocab: [],
      sources: [],
      listening: [],
      workLogs: [],
    });
  }

  try {
    const mine = {
      OR: [{ assignedToId: uid }, { createdById: uid }],
    };

    const [
      tasks,
      docs,
      projects,
      users,
      vocab,
      sources,
      listening,
      workLogs,
    ] = await Promise.all([
      db.task.findMany({
        where: {
          AND: [
            mine,
            taskWhereExcludeHub(),
            {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
              ],
            },
          ],
        },
        select: {
          id: true,
          title: true,
          status: true,
          projectId: true,
          project: { select: { name: true } },
        },
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      db.doc.findMany({
        where: {
          userId: uid,
          deletedAt: null,
          archived: false,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { contentText: { contains: query, mode: "insensitive" } },
          ],
        },
        select: { id: true, title: true, area: true },
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      db.project.findMany({
        where: {
          status: { not: "ARCHIVED" },
          members: { some: { userId: uid } },
          name: { contains: query, mode: "insensitive" },
        },
        select: { id: true, name: true, area: true },
        take: limit,
        orderBy: { name: "asc" },
      }),
      session.user.role === "ADMIN"
        ? db.user.findMany({
            where: {
              status: "ACTIVE",
              id: { not: uid },
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
              ],
            },
            select: { id: true, name: true, email: true },
            take: Math.min(limit, 5),
          })
        : Promise.resolve([]),
      db.langCard.findMany({
        where: {
          userId: uid,
          OR: [
            { front: { contains: query, mode: "insensitive" } },
            { back: { contains: query, mode: "insensitive" } },
            { example: { contains: query, mode: "insensitive" } },
            { tags: { contains: query, mode: "insensitive" } },
          ],
        },
        select: { id: true, front: true, back: true, deckKey: true },
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      db.docSource.findMany({
        where: {
          doc: { userId: uid, deletedAt: null },
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { authors: { contains: query, mode: "insensitive" } },
            { doi: { contains: query, mode: "insensitive" } },
            { notes: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          title: true,
          authors: true,
          doi: true,
          docId: true,
        },
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      db.langListeningClip.findMany({
        where: {
          userId: uid,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { notes: { contains: query, mode: "insensitive" } },
            { transcript: { contains: query, mode: "insensitive" } },
            { level: { contains: query, mode: "insensitive" } },
          ],
        },
        select: { id: true, title: true, level: true },
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      db.workLog.findMany({
        where: {
          userId: uid,
          OR: [
            { description: { contains: query, mode: "insensitive" } },
            { task: { title: { contains: query, mode: "insensitive" } } },
          ],
        },
        select: {
          id: true,
          hours: true,
          description: true,
          date: true,
          task: { select: { title: true } },
        },
        take: limit,
        orderBy: { date: "desc" },
      }),
    ]);

    return NextResponse.json({
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        projectId: t.projectId,
        meta: t.project?.name ?? t.status,
        href: `/tasks?search=${encodeURIComponent(t.title)}`,
      })),
      docs: docs.map(d => ({
        id: d.id,
        title: d.title,
        meta: d.area,
        href: `/docs?id=${d.id}`,
      })),
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        meta: p.area,
        href: `/projects/${p.id}`,
      })),
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        href: "/users",
      })),
      vocab: vocab.map(c => ({
        id: c.id,
        title: c.front,
        meta: c.back.slice(0, 80),
        href: "/language?tab=vocab",
      })),
      sources: sources.map(s => ({
        id: s.id,
        title: s.title,
        meta: s.authors ?? s.doi ?? undefined,
        href: `/docs?id=${s.docId}`,
      })),
      listening: listening.map(c => ({
        id: c.id,
        title: c.title,
        meta: c.level ?? undefined,
        href: "/language?tab=listening",
      })),
      workLogs: workLogs.map(w => ({
        id: w.id,
        title: w.task.title,
        meta: w.description?.slice(0, 80) || `${w.hours}h`,
        href: "/work-logs",
      })),
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "جستجو ناموفق بود" }, { status: 500 });
  }
}
