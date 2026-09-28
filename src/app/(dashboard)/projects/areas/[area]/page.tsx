import { requireModule } from "@/lib/require-role";
import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { coerceLifeArea } from "@/lib/life";
import { getAreaDashboard } from "@/features/projects/queries";
import { AreaDashboardCC } from "../../components/client/area-dashboard-cc";
import { localizedTitle } from "@/lib/page-title";

type Props = { params: Promise<{ area: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { area: raw } = await params;
  const area = coerceLifeArea(raw.toUpperCase());
  const titles: Record<string, [string, string]> = {
    PHD: ["داشبورد دکتری", "PhD area"],
    WORK: ["داشبورد کار", "Work area"],
    LIFE: ["داشبورد زندگی", "Life area"],
    LANG: ["داشبورد زبان", "Language area"],
  };
  const [fa, en] = titles[area] ?? ["حوزه", "Area"];
  return localizedTitle(fa, en);
}

export default async function AreaDashboardPage({ params }: Props) {
  await requireModule("projects");
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { area: raw } = await params;
  const upper = raw.toUpperCase();
  if (!["PHD", "WORK", "LIFE", "LANG"].includes(upper)) notFound();
  const area = coerceLifeArea(upper);

  const data = await getAreaDashboard(session.user.id, area);
  if (!data) notFound();

  return <AreaDashboardCC data={data} />;
}
