import dotenv from "dotenv";
import { readFileSync } from "fs";
import { resolve } from "path";

dotenv.config({ path: ".env" });

function getVersion(): string {
  try {
    const pkgPath = resolve(process.cwd(), "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return pkg.version;
  } catch {
    return "unknown";
  }
}

async function setWebhook() {
  const token = process.env.BALE_BOT_TOKEN;
  const appUrl = process.env.APP_URL;
  const baseUrl = process.env.BALE_BASE_URL ?? "https://tapi.bale.ai/bot";
  const adminChatId = process.env.BALE_ADMIN_CHAT_ID;

  if (!token) {
    throw new Error("BALE_BOT_TOKEN is not defined");
  }

  if (!appUrl) {
    throw new Error("APP_URL is not defined");
  }

  const webhookUrl = `${appUrl}/api/bale/webhook`;

  const response = await fetch(`${baseUrl}${token}/setWebhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: webhookUrl,
    }),
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(`Failed to set Bale webhook: ${JSON.stringify(result)}`);
  }

  console.log(`Bale webhook set to: ${webhookUrl}`);
  console.log(result);

  if (adminChatId) {
    await sendStartupMessage(token, baseUrl, adminChatId);
  }
}

async function sendStartupMessage(
  token: string,
  baseUrl: string,
  chatId: string,
) {
  const version = getVersion();
  const message = `🚀 *Scrumflow Started*\n\nVersion: \`${version}\`\nStatus: Webhook configured\nTime: ${new Date().toISOString()}`;

  const response = await fetch(`${baseUrl}${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    }),
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    console.error(`Failed to send startup message: ${JSON.stringify(result)}`);
  } else {
    console.log("Startup message sent to admin chat");
  }
}

setWebhook().catch(error => {
  console.error(error);
  process.exit(1);
});
