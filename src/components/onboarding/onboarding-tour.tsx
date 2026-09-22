"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui-kit/forms/button";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { completeOnboardingAction } from "@/features/onboarding/actions";
import { AREA_META, LIFE_AREAS } from "@/lib/life";
import { cn } from "@/lib/utils";

const STEPS = ["welcome", "areas", "today", "language", "research"] as const;

export function OnboardingTour({ open }: { open: boolean }) {
  const t = useTranslation();
  const language = useLanguage();
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [pending, setPending] = React.useState(false);
  const [visible, setVisible] = React.useState(open);

  React.useEffect(() => {
    setVisible(open);
  }, [open]);

  if (!visible) return null;

  async function finish() {
    setPending(true);
    await completeOnboardingAction();
    setPending(false);
    setVisible(false);
    router.refresh();
  }

  const current = STEPS[step] ?? "welcome";
  const isLast = step >= STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/45 p-4">
      <div
        className="w-full max-w-lg rounded-2xl border bg-card shadow-xl p-5 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <div className="flex gap-1.5 mb-4">
          {STEPS.map((_, i) => (
            <span
              key={STEPS[i]}
              className={cn(
                "h-1 flex-1 rounded-full",
                i <= step ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>

        {current === "welcome" && (
          <StepBody
            titleId="onboarding-title"
            title={t.onboarding.welcomeTitle}
            body={t.onboarding.welcomeBody}
          />
        )}
        {current === "areas" && (
          <div>
            <StepBody
              titleId="onboarding-title"
              title={t.onboarding.areasTitle}
              body={t.onboarding.areasBody}
            />
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {LIFE_AREAS.map(area => (
                <li
                  key={area}
                  className="rounded-lg border px-3 py-2 text-sm"
                >
                  <div className="font-medium">
                    {language === "FA"
                      ? AREA_META[area].nameFa
                      : AREA_META[area].nameEn}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {language === "FA"
                      ? AREA_META[area].descriptionFa
                      : AREA_META[area].descriptionEn}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {current === "today" && (
          <StepBody
            titleId="onboarding-title"
            title={t.onboarding.todayTitle}
            body={t.onboarding.todayBody}
            href="/dashboard"
            linkLabel={t.onboarding.openToday}
          />
        )}
        {current === "language" && (
          <StepBody
            titleId="onboarding-title"
            title={t.onboarding.languageTitle}
            body={t.onboarding.languageBody}
            href="/language"
            linkLabel={t.onboarding.openLanguage}
          />
        )}
        {current === "research" && (
          <StepBody
            titleId="onboarding-title"
            title={t.onboarding.researchTitle}
            body={t.onboarding.researchBody}
            href="/research"
            linkLabel={t.onboarding.openResearch}
          />
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => void finish()}
          >
            {t.onboarding.skip}
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button
                size="sm"
                variant="subtle"
                onClick={() => setStep(s => Math.max(0, s - 1))}
              >
                {t.common.back}
              </Button>
            )}
            {!isLast ? (
              <Button size="sm" onClick={() => setStep(s => s + 1)}>
                {t.onboarding.next}
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={pending}
                onClick={() => void finish()}
              >
                {t.onboarding.done}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepBody({
  titleId,
  title,
  body,
  href,
  linkLabel,
}: {
  titleId: string;
  title: string;
  body: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div>
      <h2 id={titleId} className="text-lg font-semibold">
        {title}
      </h2>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
        {body}
      </p>
      {href && linkLabel && (
        <Link
          href={href}
          className="inline-flex mt-3 text-sm text-primary hover:underline"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
