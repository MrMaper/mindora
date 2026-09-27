import { requireModule } from "@/lib/require-role";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getBoardColumns } from "@/features/kanban/queries";
import { getAssignableUsers } from "@/features/users/queries";
import { getLabels } from "@/features/labels/queries";
import { getTranslationsAsync } from "@/i18n";
import {
  ensurePersonalWorkspaceCached,
  getUserPreferencesCached,
} from "@/lib/request-cache";
import { personalAreaProjectId } from "@/lib/life";
import { RESEARCH_BOARD_STATUSES } from "@/features/kanban/types";
import {
  getResearchHubData,
  listPhdResearchProjects,
  parseResearchProjectScope,
  resolveResearchTaskProjectIds,
} from "@/features/research/queries";
import { RESEARCH_SCOPE_COOKIE } from "@/features/research/scope-cookie";
import { ResearchCC } from "./research-cc";
import { localizedTitle } from "@/lib/page-title";

export function generateMetadata(): Promise<Metadata> {
  return localizedTitle("پژوهش", "Research");
}

export default async function ResearchPage({
  searchParams,
}:  {
  searchParams: Promise<{ project?: string }>;
}) {
  await requireModule("research");
  const session = await auth();
  if (!session?.user) redirect("/login");
  await ensurePersonalWorkspaceCached(session.user.id);

  const prefs = await getUserPreferencesCached(session.user.id);
  const language = prefs?.language ?? "FA";
  const t = await getTranslationsAsync(language);

  const { project: projectParam } = await searchParams;
  const cookieStore = await cookies();
  const cookieScope = cookieStore.get(RESEARCH_SCOPE_COOKIE)?.value;

  // Prefer URL; otherwise restore last scope from cookie (avoids all→project flicker).
  const requested = parseResearchProjectScope(
    projectParam ?? (cookieScope && cookieScope !== "all" ? cookieScope : null),
  );

  const phdProjects = await listPhdResearchProjects(session.user.id);

  const safeScope =
    requested !== "all" &&
    requested !== "inbox" &&
    !phdProjects.some(p => p.id === requested)
      ? "all"
      : requested;

  // Align URL before loading the board so the first paint matches the scope.
  if (!projectParam && safeScope !== "all") {
    redirect(`/research?project=${encodeURIComponent(safeScope)}`);
  }

  const boardProjectIds = await resolveResearchTaskProjectIds(
    session.user.id,
    safeScope,
  );

  const phdInbox = personalAreaProjectId(session.user.id, "PHD");

  const filterProject =
    safeScope === "all"
      ? ""
      : safeScope === "inbox"
        ? phdInbox
        : safeScope;

  const [columns, users, labels, hub] = await Promise.all([
    getBoardColumns(
      {
        assigneeId: session.user.id,
        projectIds: boardProjectIds,
        excludeHub: false,
      },
      RESEARCH_BOARD_STATUSES,
    ),
    getAssignableUsers(session.user.id),
    getLabels(),
    getResearchHubData(session.user.id, safeScope),
  ]);

  const kanbanProjects = [
    {
      id: phdInbox,
      name: t.life.researchProjectInbox,
      description: null,
      status: "ACTIVE" as const,
      area: "PHD" as const,
      teamId: null,
      teamName: null,
      memberCount: 1,
      createdAt: new Date(0),
    },
    ...phdProjects.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      status: "ACTIVE" as const,
      area: "PHD" as const,
      teamId: null,
      teamName: null,
      memberCount: 1,
      createdAt: new Date(0),
    })),
  ];

  return (
    <ResearchCC
      hub={hub}
      scope={safeScope}
      phdProjects={phdProjects}
      initialColumns={columns}
      users={users}
      labels={labels}
      userProjects={kanbanProjects}
      filters={{
        search: "",
        assignee: session.user.id,
        label: "",
        priority: "",
        project: filterProject,
      }}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
      statuses={RESEARCH_BOARD_STATUSES}
      columnLabels={{
        BACKLOG: t.life.researchIdea,
        TODO: t.life.researchReading,
        IN_PROGRESS: t.life.researchWriting,
        REVIEW: t.life.researchFeedback,
        DONE: t.life.researchDone,
      }}
    />
  );
}
