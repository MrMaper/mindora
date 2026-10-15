"use client";

import type { Language } from "@/types/db";
import { BrandMark } from "@/components/brand-mark";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Button } from "@/components/ui-kit/forms/button";
import styles from "./error-fallback.module.css";

const COPY = {
  FA: {
    kicker: "یک لحظه قطع شد",
    title: "نقشه کمی به هم ریخت",
    description:
      "مشکلی پیش آمد. صفحه را دوباره بارگذاری کن؛ اگر ادامه داشت با پشتیبانی تماس بگیر.",
    reloadPage: "بارگذاری مجدد",
    goHome: "بازگشت به امروز",
    hint: "نگران نباش — معمولاً با یک رفرش درست می‌شود.",
    ghost: "!",
  },
  EN: {
    kicker: "Brief interruption",
    title: "The map got a little messy",
    description:
      "Something went wrong. Reload the page, or contact support if it keeps happening.",
    reloadPage: "Reload page",
    goHome: "Back to Today",
    hint: "Usually a quick reload puts things back in place.",
    ghost: "!",
  },
} as const;

export function ErrorFallback({
  language,
  onReload,
  onHome,
  detail,
}: {
  language: Language;
  onReload: () => void;
  onHome: () => void;
  detail?: string | null;
}) {
  const t = COPY[language === "EN" ? "EN" : "FA"];
  const isRtl = language !== "EN";
  const detailText = detail?.trim() ? detail.trim().slice(0, 120) : null;

  return (
    <div
      className={styles.root}
      dir={isRtl ? "rtl" : "ltr"}
      role="alert"
    >
      <div className={styles.bg} aria-hidden />
      <div className={styles.grid} aria-hidden />
      <div className={styles.orbA} aria-hidden />
      <div className={styles.orbB} aria-hidden />
      <div className={styles.orbC} aria-hidden />
      <div className={styles.ghost} aria-hidden>
        {t.ghost}
      </div>

      <div className={styles.panel}>
        <div className={styles.brand}>
          <BrandMark size="sm" />
        </div>

        <div className={styles.badge} aria-hidden>
          <span className={styles.badgeRing} />
          <span className={styles.badgeCore}>
            <Icon name="alert-triangle" size={26} />
          </span>
        </div>

        <p className={styles.kicker}>{t.kicker}</p>
        <h1 className={styles.title}>{t.title}</h1>
        <p className={styles.desc}>{t.description}</p>

        {detailText ? (
          <p className={styles.detail} title={detailText} dir="ltr">
            {detailText}
          </p>
        ) : null}

        <div className={styles.actions}>
          <Button
            variant="primary"
            icon="rotate-ccw"
            onClick={onReload}
            className="w-full sm:w-auto sm:min-w-40"
          >
            {t.reloadPage}
          </Button>
          <Button
            variant="subtle"
            icon="home"
            onClick={onHome}
            className="w-full sm:w-auto sm:min-w-40"
          >
            {t.goHome}
          </Button>
        </div>

        <p className={styles.hint}>{t.hint}</p>
      </div>
    </div>
  );
}
