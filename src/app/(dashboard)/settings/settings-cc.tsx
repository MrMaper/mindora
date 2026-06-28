"use client";

import * as React from "react";
import { useSettings } from "./use-settings";
import { getTranslations } from "@/i18n";
import type { Language } from "@/types/db";

interface SettingsCCProps {
  currentLanguage: Language;
}

export function SettingsCC({ currentLanguage }: SettingsCCProps) {
  const settings = useSettings(currentLanguage);
  const t = getTranslations(settings.language);

  const languages: Array<{ value: Language; label: string }> = [
    { value: "EN", label: t.settings.english },
    { value: "FA", label: t.settings.persian },
  ];

  return (
    <div style={{ maxWidth: 560 }}>
      <h1
        style={{
          fontSize: "var(--text-xl)",
          fontWeight: "var(--weight-semibold)",
          color: "var(--text-primary)",
          marginBottom: "var(--space-6)",
        }}
      >
        {t.settings.title}
      </h1>

      {/* ── Language Settings ─────────────────────────────────────────── */}
      <section style={{ marginBottom: "var(--space-8)" }}>
        <div
          style={{
            fontSize: "var(--text-2xs)",
            fontWeight: "var(--weight-semibold)",
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "var(--tracking-caps)",
            marginBottom: "var(--space-4)",
          }}
        >
          {t.settings.preferences}
        </div>

        <div
          style={{
            paddingBottom: "var(--space-6)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <label
            style={{
              display: "block",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-medium)",
              color: "var(--text-primary)",
              marginBottom: "var(--space-3)",
            }}
          >
            {t.settings.language}
          </label>

          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            {languages.map(lang => (
              <button
                key={lang.value}
                onClick={() => settings.onLanguageChange(lang.value)}
                disabled={settings.languagePending}
                style={{
                  flex: 1,
                  padding: "var(--space-3) var(--space-4)",
                  borderRadius: "var(--radius-md)",
                  border:
                    settings.language === lang.value
                      ? "2px solid var(--blue-500)"
                      : "1px solid var(--border-subtle)",
                  backgroundColor:
                    settings.language === lang.value
                      ? "var(--blue-50)"
                      : "var(--surface-default)",
                  color:
                    settings.language === lang.value
                      ? "var(--blue-600)"
                      : "var(--text-primary)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--weight-medium)",
                  cursor: settings.languagePending ? "not-allowed" : "pointer",
                  opacity: settings.languagePending ? 0.6 : 1,
                  transition: "all 0.2s ease",
                }}
              >
                {lang.label}
              </button>
            ))}
          </div>

          {settings.languageError && (
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--red-500)",
                marginTop: "var(--space-2)",
              }}
              role="alert"
            >
              {settings.languageError}
            </p>
          )}

          {settings.languageSuccess && (
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--green-600)",
                marginTop: "var(--space-2)",
              }}
              role="status"
            >
              ✓ {t.settings.languageUpdated}
            </p>
          )}
        </div>
      </section>

      {/* ── Additional Settings (Placeholder) ──────────────────────────── */}
      <section>
        <div
          style={{
            fontSize: "var(--text-2xs)",
            fontWeight: "var(--weight-semibold)",
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "var(--tracking-caps)",
            marginBottom: "var(--space-4)",
          }}
        >
          {t.settings.moreOptions}
        </div>

        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--text-tertiary)",
          }}
        >
          {t.settings.comingSoon}
        </p>
      </section>
    </div>
  );
}
