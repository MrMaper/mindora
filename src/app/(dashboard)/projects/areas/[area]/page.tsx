import { requireModule } from "@/lib/require-role";
import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { isLifeAreaValue } from "@/lib/areas";
import { getMemberContext } from "@/lib/areas/server";
import { getAreaDashboard } from "@/features/projects/queries";
import { AreaDashboardCC } from "../../components/client/area-dashboard-cc";
import { localizedTitle } from "@/lib/page-title";

type Props = { params: Promise<{ area: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const session = await auth();
  const { area: raw } = await params;
  if (!session?.user) {
    return localizedTitle("حوزه", "Area");
  }
  const ctx = await getMemberContext(session.user.id);
  const upper = raw.toUpperCase();
  const ref =
    ctx.areas.find(a => a.id === raw) ??
    ctx.areas.find(a => a.legacyEnum === upper) ??
    null;
  const name = ref
    ? ref.nameFa
    : isLifeAreaValue(upper)
      ? upper
      : "حوزه";
  return localizedTitle(`داشبورد ${name}`, `${name} area`);
}

export default async function AreaDashboardPage({ params }: Props) {
  await requireModule("projects");
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { area: raw } = await params;

  // Legacy slug → permanent redirect to UserArea id.
  if (isLifeAreaValue(raw.toUpperCase())) {
    const ctx = await getMemberContext(session.user.id);
    const match = ctx.areas.find(a => a.legacyEnum === raw.toUpperCase());
    if (match && match.id !== raw) {
      redirect(`/projects/areas/${match.id}`);
    }
  }

  const data = await getAreaDashboard(session.user.id, raw);
  if (!data) notFound();

  return <AreaDashboardCC data={data} />;
}
