import { requireModule } from "@/lib/require-role";
import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { getMemberContext } from "@/lib/areas/server";
import { areaDashboardHref, areaDisplayName } from "@/lib/areas";
import { normalizeAreaParam } from "@/lib/project-namespace";
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
  const id = normalizeAreaParam(raw, ctx.areas);
  const ref = ctx.areas.find(a => a.id === id) ?? null;
  const name = ref ? areaDisplayName(ref, "FA") : "حوزه";
  return localizedTitle(`داشبورد ${name}`, `${name} area`);
}

export default async function AreaDashboardPage({ params }: Props) {
  await requireModule("projects");
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { area: raw } = await params;

  // Legacy slugs (phd/research · work · life · lang/language) resolve through
  // templateKey / hubFor to the member's own UserArea id.
  const ctx = await getMemberContext(session.user.id);
  const id = normalizeAreaParam(raw, ctx.areas);
  if (id !== raw && ctx.areas.some(a => a.id === id)) {
    redirect(areaDashboardHref(id));
  }

  const data = await getAreaDashboard(session.user.id, raw);
  if (!data) notFound();

  return <AreaDashboardCC data={data} />;
}
