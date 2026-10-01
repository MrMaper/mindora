import { prisma as db } from "@/lib/db";
import { sendMail } from "@/lib/mail";

export type BroadcastAudience = "all_active" | "members_only" | "admins_only";

export async function sendAdminBroadcast(input: {
  actorId: string;
  title: string;
  body: string;
  audience: BroadcastAudience;
  channel: "in_app" | "email" | "both";
}): Promise<{ recipients: number; emailed: number }> {
  const title = input.title.trim().slice(0, 120);
  const body = input.body.trim().slice(0, 2000);
  if (!title || !body) {
    throw new Error("empty");
  }

  const where =
    input.audience === "members_only"
      ? { status: "ACTIVE" as const, role: "MEMBER" as const }
      : input.audience === "admins_only"
        ? { status: "ACTIVE" as const, role: "ADMIN" as const }
        : { status: "ACTIVE" as const };

  const users = await db.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      preferences: { select: { emailNotifs: true } },
    },
  });

  if (users.length === 0) return { recipients: 0, emailed: 0 };

  if (input.channel === "in_app" || input.channel === "both") {
    await db.notification.createMany({
      data: users.map(u => ({
        userId: u.id,
        type: "SYSTEM_BROADCAST" as const,
        title,
        body,
        data: { audience: input.audience, fromAdmin: true },
      })),
    });
  }

  let emailed = 0;
  if (input.channel === "email" || input.channel === "both") {
    for (const u of users) {
      if (!u.email) continue;
      // Force admin broadcast email even if emailNotifs is off when channel is email-only;
      // for "both", still respect emailNotifs to avoid surprise spam.
      if (input.channel === "both" && u.preferences?.emailNotifs === false) {
        continue;
      }
      try {
        await sendMail({
          to: u.email,
          subject: title,
          html: `<div style="font-family:system-ui,sans-serif;max-width:540px;margin:0 auto;padding:24px;direction:rtl;color:#1a1f25">
  <h2 style="font-size:16px;margin:0 0 12px">${escapeHtml(title)}</h2>
  <p style="font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap">${escapeHtml(body)}</p>
  <p style="font-size:12px;color:#828c99;margin:20px 0 0">Mindora</p>
</div>`,
        });
        emailed += 1;
      } catch (err) {
        console.error("[admin:broadcast:email]", u.email, err);
      }
    }
  }

  return { recipients: users.length, emailed };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
