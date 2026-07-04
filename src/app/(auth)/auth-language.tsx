"use client";

import * as React from "react";
import { getTranslations } from "@/i18n";
import type { Language } from "@/types/db";
import { Icon } from "@/components/ui-kit/foundation/icon";

const STORAGE_KEY = "scrumflow-auth-language";
const defaultLanguage: Language = "FA";

const AuthLanguageContext = React.createContext<{
  language: Language;
  t: ReturnType<typeof getTranslations>;
  setLanguage: (language: Language) => void;
} | null>(null);

function normalizeLanguage(value: unknown): Language {
  return value === "FA" ? "FA" : "EN";
}

function syncDocumentDirection(language: Language) {
  const dir = language === "FA" ? "rtl" : "ltr";
  const lang = language === "FA" ? "fa" : "en";
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
}

export function AuthLanguageProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [language, setLanguageState] =
    React.useState<Language>(defaultLanguage);

  React.useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const storedLanguage = raw ? normalizeLanguage(raw) : defaultLanguage;
    setLanguageState(storedLanguage);
    syncDocumentDirection(storedLanguage);
  }, []);

  const setLanguage = React.useCallback((nextLanguage: Language) => {
    const normalized = normalizeLanguage(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, normalized);
    setLanguageState(normalized);
    syncDocumentDirection(normalized);
  }, []);

  const value = React.useMemo(
    () => ({ language, t: getTranslations(language), setLanguage }),
    [language, setLanguage],
  );

  return (
    <AuthLanguageContext.Provider value={value}>
      {children}
    </AuthLanguageContext.Provider>
  );
}

export function useAuthLanguage() {
  const context = React.useContext(AuthLanguageContext);
  if (!context) {
    throw new Error(
      "useAuthLanguage must be used inside AuthLanguageProvider.",
    );
  }
  return context;
}

export function AuthLanguageSwitch() {
  const { language, setLanguage } = useAuthLanguage();

  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onDoc(e: MouseEvent | TouchEvent) {
      if (!ref.current) return;
      const target = e.target as Node | null;
      if (target && !ref.current.contains(target)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{ position: "fixed", bottom: 16, right: 16, zIndex: 60 }}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className="auth-page__language-toggle"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid rgba(0,0,0,0.08)",
          background: "var(--sf-bg, #fff)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <Icon name="language" size={16} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>{language}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Language menu"
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            right: 0,
            minWidth: 120,
            borderRadius: 8,
            overflow: "hidden",
            background: "var(--sf-bg, #fff)",
            boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
          }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setLanguage("EN");
              setOpen(false);
            }}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "8px 12px",
              border: "none",
              background: "transparent",
            }}
          >
            EN
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setLanguage("FA");
              setOpen(false);
            }}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "8px 12px",
              border: "none",
              background: "transparent",
            }}
          >
            FA
          </button>
        </div>
      )}
    </div>
  );
}
