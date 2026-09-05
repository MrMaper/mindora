import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function setWebhook() {
  const token = process.env.BALE_BOT_TOKEN;
  const appUrl = process.env.APP_URL;
  const baseUrl = process.env.BALE_BASE_URL;

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
}

setWebhook().catch(error => {
  console.error(error);
  process.exit(1);
});
