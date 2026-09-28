import type { Metadata } from "next";
import { requireAdmin } from "@/lib/require-role";
import { localizedTitle } from "@/lib/page-title";
import { prisma as db } from "@/lib/db";
import { getBaleSettingsView } from "@/features/external/bots/bale/config";
import { BaleSettingsCC } from "./settings-cc";

export function generateMetadata(): Promise<Metadata> {
  return localizedTitle("ربات بله", "Bale bot");
}

export default async function BaleBotPage() {
  await requireAdmin();
  const [view, members, deliveries] = await Promise.all([
    getBaleSettingsView(),
    db.user.findMany({
      where: { role: "MEMBER" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        baleUserId: true,
        status: true,
        baleLinkExpires: true,
      },
    }),
    db.baleDelivery.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, createdAt: true, kind: true, ok: true, error: true, preview: true },
    }),
  ]);

  return (
    <BaleSettingsCC
      view={view}
      members={members.map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        baleUserId: member.baleUserId,
        status: member.status,
        linkPending: !!member.baleLinkExpires && member.baleLinkExpires.getTime() > Date.now(),
      }))}
      deliveries={deliveries.map((row) => ({
        id: row.id,
        at: row.createdAt.toLocaleString("fa-IR"),
        kind: row.kind,
        ok: row.ok,
        error: row.error,
        preview: row.preview,
      }))}
    />
  );
}
