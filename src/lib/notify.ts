import { prisma as db } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { shouldDeliverNotification } from "@/lib/notify-prefs";
import type { NotificationType } from "@/types/db";

export { shouldDeliverNotification } from "@/lib/notify-prefs";

export async function notify(opts: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: opts.userId },
    select: {
      email: true,
      preferences: {
        select: {
          notifications: true,
          emailNotifs: true,
          notifyTaskAssigned: true,
          notifyTaskUpdated: true,
          notifyTaskCommented: true,
          notifyMention: true,
          notifySprintStarted: true,
          notifySprintEnded: true,
          notifyDeadlineApproaching: true,
          notifyStatusChanged: true,
        },
      },
    },
  });
  if (!user) return;

  if (!shouldDeliverNotification(opts.type, user.preferences)) return;

  await db.notification.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      data: opts.data as object | undefined,
    },
  });

  if (user.preferences?.emailNotifs && user.email) {
    const bodyHtml = opts.body
      ? `<p style="margin:0 0 12px;line-height:1.5">${escapeHtml(opts.body)}</p>`
      : "";
    await sendMail({
      to: user.email,
      subject: opts.title,
      html: `<div style="font-family:system-ui,sans-serif;max-width:540px;margin:0 auto;padding:24px;color:#1a1f25">
  <h2 style="font-size:16px;margin:0 0 12px">${escapeHtml(opts.title)}</h2>
  ${bodyHtml}
  <p style="font-size:12px;color:#828c99;margin:16px 0 0">Mindora</p>
</div>`,
    }).catch(err => {
      console.error("[notify:email]", err);
    });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
