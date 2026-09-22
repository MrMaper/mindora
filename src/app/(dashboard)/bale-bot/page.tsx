import { requireAdmin } from "@/lib/require-role";
import { BaleBotTester } from "./client";

export default async function BaleBotPage() {
  await requireAdmin();
  return <BaleBotTester />;
}
