import { requireModule } from "@/lib/require-role";
import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { AREA_META, coerceLifeArea, isLifeAreaValue } from "@/lib/areas";
import { getAreaDashboard } from "@/features/projects/queries";
import { AreaDashboardCC } from "../../components/client/area-dashboard-cc";
import { localizedTitle } from "@/lib/page-title";

type Props = { params: Promise<{ area: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { area: raw } = await params;
  const area = coerceLifeArea(raw.toUpperCase());
  const meta = AREA_META[area];
  return localizedTitle(`داشبورد ${meta.nameFa}`, `${meta.nameEn} area`);
}

export default async function AreaDashboardPage({ params }: Props) {
  await requireModule("projects");
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { area: raw } = await params;
  const upper = raw.toUpperCase();
  if (!isLifeAreaValue(upper)) notFound();
  const area = coerceLifeArea(upper);

  const data = await getAreaDashboard(session.user.id, area);
  if (!data) notFound();

  return <AreaDashboardCC data={data} />;
}
