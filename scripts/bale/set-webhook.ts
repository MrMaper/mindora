import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaClient } from "../../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DEFAULT_BASE = "https://tapi.bale.ai/bot";

function trimSlash(value: string) {
  return value.trim().replace(/\/+$/, "");
}

async function main() {
  const appUrl = trimSlash(
    process.env.APP_URL || process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "",
  );
  const envToken = (process.env.BALE_BOT_TOKEN ?? "").trim();
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter });

  try {
    const row = await db.baleConfig.findUnique({ where: { id: "default" } });
    const enabled = row ? row.enabled : envToken.length > 0;
    const token = row?.botToken.trim() || envToken;
    const baseUrl = trimSlash(row?.baseUrl || process.env.BALE_BASE_URL || DEFAULT_BASE) || DEFAULT_BASE;

    if (!enabled) {
      console.log("Bale bot is off in settings; webhook left unchanged.");
      return;
    }
    if (!token || !appUrl) {
      console.log("Bale webhook skipped (token or public URL missing).");
      return;
    }

    const webhookUrl = `${appUrl}/api/bale/webhook`;
    const response = await fetch(`${baseUrl}${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl }),
    });
    const result = (await response.json()) as { ok?: boolean; description?: string };
    if (!response.ok || !result.ok) {
      throw new Error(result.description || "Bale rejected setWebhook");
    }
    console.log(`Bale webhook set to: ${webhookUrl}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
