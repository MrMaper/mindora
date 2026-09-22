"use client";

import * as React from "react";
import type { Language } from "@/types/db";
import type { Translations } from "@/i18n";
import { loadTranslations } from "@/i18n/load";
import { Icon } from "@/components/ui-kit/foundation/icon";

const STORAGE_KEY = "mindora-auth-language";
const defaultLanguage: Language = "FA";

const AuthLanguageContext = React.createContext<{
  language: Language;
  t: Translations;
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
  const [language, setLanguageState] = React.useState<Language>(defaultLanguage);
  const [t, setT] = React.useState<Translations | null>(null);

  React.useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const storedLanguage = raw ? normalizeLanguage(raw) : defaultLanguage;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLanguageState(storedLanguage);
    syncDocumentDirection(storedLanguage);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    void loadTranslations(language).then(next => {
      if (!cancelled) setT(next);
    });
    return () => {
      cancelled = true;
    };
  }, [language]);

  const setLanguage = React.useCallback((nextLanguage: Language) => {
    const normalized = normalizeLanguage(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, normalized);
    setLanguageState(normalized);
    syncDocumentDirection(normalized);
  }, []);

  if (!t) {
    return (
      <div className="min-h-dvh bg-background" aria-busy="true" aria-label="Loading" />
    );
  }

  return (
    <AuthLanguageContext.Provider value={{ language, t, setLanguage }}>
      {children}
    </AuthLanguageContext.Provider>
  );
}

export function useAuthLanguage() {
  const context = React.useContext(AuthLanguageContext);
  if (!context) {
    throw new Error("useAuthLanguage must be used inside AuthLanguageProvider.");
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
    <div ref={ref} className="fixed bottom-4 right-4 z-60">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background shadow-sm hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon name="language" size={16} />
        <span className="text-sm font-semibold">{language}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="منوی زبان"
          className="absolute bottom-full right-0 mb-2 min-w-[120px] rounded-lg bg-background border border-border shadow-lg overflow-hidden"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setLanguage("EN");
              setOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors focus-visible:outline-none"
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
            className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors focus-visible:outline-none"
          >
            FA
          </button>
        </div>
      )}
    </div>
  );
}
