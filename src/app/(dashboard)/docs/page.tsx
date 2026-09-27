import { requireModule } from "@/lib/require-role";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ensurePersonalWorkspaceCached } from "@/lib/request-cache";
import { getDocById, getDocs } from "@/features/docs/queries";
import { DocsCC } from "./docs-cc";
import { localizedTitle } from "@/lib/page-title";

export function generateMetadata(): Promise<Metadata> {
  return localizedTitle("نوشته‌ها", "Docs");
}

export default async function DocsPage({
  searchParams,
}:  {
  searchParams: Promise<{ id?: string }>;
}) {
  await requireModule("docs");
  const session = await auth();
  if (!session?.user) redirect("/login");
  await ensurePersonalWorkspaceCached(session.user.id);

  const { id } = await searchParams;
  const requested = id ? await getDocById(session.user.id, id) : null;
  const showArchived = requested?.archived ?? false;
  const docs = await getDocs(session.user.id, {
    archived: showArchived,
    take: 80,
  });

  const initialDoc =
    requested ??
    (docs[0] ? await getDocById(session.user.id, docs[0].id) : null);

  return (
    <DocsCC
      initialDocs={docs}
      initialDoc={initialDoc}
      initialShowArchived={showArchived}
    />
  );
}
