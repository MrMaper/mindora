"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { BrandMark } from "@/components/brand-mark";
import { useAuthLanguage } from "./auth-language";
import { cn } from "@/lib/utils";
import styles from "./auth-stage.module.css";

export function AuthSimplePanel({
  title,
  subtitle,
  children,
  visualEyebrow,
  visualTitle,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  visualEyebrow?: string;
  visualTitle?: string;
}) {
  const { t, language } = useAuthLanguage();
  const dir = language === "FA" ? "rtl" : "ltr";

  return (
    <div className={styles.stage} dir="ltr">
      <div
        className={cn(styles.shell, styles.shellCompact, styles.shellSimple)}
        data-auth-shell
        data-mode="login"
      >
        <div className={styles.stageMobileStack}>
          <aside className={styles.visual} aria-hidden={false}>
            <div className={styles.visualMedia}>
              <Image
                src="/auth-visual.jpg"
                alt=""
                fill
                priority
                sizes="(max-width: 859px) 100vw, 220px"
              />
            </div>
            <div className={styles.visualShade} />
            <div className={styles.visualGlow} aria-hidden />
            <div className={styles.visualContent} dir={dir}>
              <div
                className={cn(
                  styles.visualBrand,
                  "text-white [&_span]:text-white",
                )}
              >
                <BrandMark size="md" className={styles.visualBrandMark} />
              </div>
              <div className={styles.visualCopy}>
                <div className={styles.eyebrow}>
                  {visualEyebrow ?? t.auth.visualLoginEyebrow}
                </div>
                <h2 className={styles.headline}>
                  {visualTitle ?? t.auth.visualLoginTitle}
                </h2>
              </div>
            </div>
          </aside>

          <div className={cn(styles.forms, styles.formsSimple)}>
            <div className={styles.pane}>
              <div className={styles.formCard} dir={dir}>
                <h1 className={styles.formTitle}>{title}</h1>
                {subtitle ? (
                  <p className={styles.formSubtitle}>{subtitle}</p>
                ) : null}
                <div className="mt-6 min-w-0">{children}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
