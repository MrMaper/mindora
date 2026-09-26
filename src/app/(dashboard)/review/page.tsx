import { requireModule } from "@/lib/require-role";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  ensurePersonalWorkspaceCached,
  getUserPreferencesCached,
} from "@/lib/request-cache";
import { getWeeklyReview } from "@/features/life/queries";
import { getAllActiveUsers } from "@/features/users/queries";
import { getLabels } from "@/features/labels/queries";
import { getUserProjects } from "@/features/projects/queries";
import { ensureWeeklyReviewDoc } from "@/features/docs/weekly";
import { ReviewCC } from "./review-cc";

export const metadata: Metadata = { title: "بازبینی هفته" };

export default async function ReviewPage() {
  await requireModule("review");
  const session = await auth();
  if (!session?.user) redirect("/login");
  await ensurePersonalWorkspaceCached(session.user.id);

  const prefs = await getUserPreferencesCached(session.user.id);
  const language = prefs?.language ?? "FA";

  const [data, users, labels, userProjects] = await Promise.all([
    getWeeklyReview(session.user.id),
    getAllActiveUsers(),
    getLabels(),
    getUserProjects(session.user.id, "life"),
  ]);

  const weeklyDoc = await ensureWeeklyReviewDoc(session.user.id, {
    completedTitles: data.completed.map(t => t.title),
    leftoverTitles: data.leftover.map(t => t.title),
    inboxTitles: data.inbox.map(t => t.title),
    hours: data.hoursThisWeek,
    language,
  });

  return (
    <ReviewCC
      weekStart={data.weekStart}
      weekEnd={data.weekEnd}
      hoursThisWeek={data.hoursThisWeek}
      completed={data.completed}
      leftover={data.leftover}
      inbox={data.inbox}
      weeklyDocId={weeklyDoc?.id ?? null}
      users={users}
      labels={labels}
      userProjects={userProjects}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
    />
  );
}
