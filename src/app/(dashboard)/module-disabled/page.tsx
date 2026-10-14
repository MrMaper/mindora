import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MODULE_META, PRIMARY_MODULES, type PrimaryModule } from "@/lib/modules";
import { requireAuth } from "@/lib/require-role";
import { getUserPreferencesCached } from "@/lib/request-cache";

export const metadata: Metadata = { title: "—" };

function asPrimary(raw: string | undefined): PrimaryModule | null {
  switch (raw) {
    case "calendar":
    case "kanban":
    case "review":
      return "tasks";
    default:
      return (PRIMARY_MODULES as readonly string[]).includes(raw ?? "")
        ? (raw as PrimaryModule)
        : null;
  }
}

export default async function ModuleDisabledPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; r?: string }>;
}) {
  const session = await requireAuth();
  if (session.user.role === "ADMIN") redirect("/admin");

  const { m, r } = await searchParams;
  const primary = asPrimary(m);
  const memberOff = r === "member_off";

  const prefs = await getUserPreferencesCached(session.user.id);
  const fa = (prefs?.language ?? "FA") !== "EN";
  const name = primary
    ? fa
      ? MODULE_META[primary].fa
      : MODULE_META[primary].en
    : null;

  const title = fa ? "این قابلیت خاموش است" : "This feature is turned off";
  const body = memberOff
    ? fa
      ? "این قابلیت را خودت خاموش کرده‌ای."
      : "You turned this feature off yourself."
    : fa
      ? "این قابلیت برای حساب تو فعال نشده. اگر لازمش داری از مدیر بخواه."
      : "This feature is not enabled for your account. Ask your admin if you need it.";

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      {name ? (
        <p className="text-sm font-medium text-muted-foreground">{name}</p>
      ) : null}
      <p className="text-sm text-muted-foreground">{body}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {memberOff ? (
          <Link
            href="/settings?tab=capabilities"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {fa ? "روشنش کن" : "Turn it on"}
          </Link>
        ) : null}
        <Link
          href="/dashboard"
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
        >
          {fa ? "برگرد به امروز" : "Back to Today"}
        </Link>
      </div>
    </div>
  );
}
