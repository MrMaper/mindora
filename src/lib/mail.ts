import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: SendMailOptions): Promise<void> {
  if (!process.env.SMTP_HOST) {
    console.log(`\n[mail:dev] To: ${to}\nSubject: ${subject}\n${html}\n`);
    return;
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "Mindora <noreply@mindora.app>",
    to,
    subject,
    html,
  });
}

export function buildPasswordResetEmail(resetUrl: string): string {
  return `
<div style="font-family:system-ui,sans-serif;max-width:540px;margin:0 auto;padding:40px 24px;color:#1a1f25;direction:rtl">
  <h2 style="font-size:18px;font-weight:600;margin:0 0 8px">بازنشانی رمز عبور</h2>
  <p style="font-size:14px;color:#626d7b;margin:0 0 28px;line-height:1.55">
    برای بازنشانی رمز عبور Mindora خود، روی دکمه زیر کلیک کنید.
    این لینک در <strong>۱ ساعت</strong> منقضی می‌شود.
  </p>
  <a href="${resetUrl}"
    style="display:inline-block;background:#3f4cbb;color:#fff;font-size:14px;font-weight:500;
           padding:10px 22px;border-radius:5px;text-decoration:none">
    بازنشانی رمز عبور
  </a>
  <p style="font-size:12px;color:#828c99;margin:28px 0 0">
    اگر شما درخواست این کار را نداده‌ید، می‌توانید این ایمیل را نادیده بگیرید.
  </p>
</div>`;
}
