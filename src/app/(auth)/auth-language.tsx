"use client";

import * as React from "react";
import type { Language } from "@/types/db";
import type { Translations } from "@/i18n";
import { loadTranslations } from "@/i18n/load";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { AuthThemeSwitch } from "./auth-theme-switch";
import styles from "./auth-stage.module.css";

const STORAGE_KEY = "mindora-auth-language";
const defaultLanguage: Language = "FA";

const AuthLanguageContext = React.createContext<{
  language: Language;
  t: Translations;
  setLanguage: (language: Language) => void;
} | null>(null);

export { AuthLanguageContext };

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
      <div
        className={styles.authRoot}
        aria-busy="true"
        aria-label="Loading"
      />
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
    <div className={styles.dock}>
      <AuthThemeSwitch />
      <div ref={ref} className="relative">
        <button
          type="button"
          aria-haspopup="true"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          className={styles.dockBtn}
        >
          <Icon name="language" size={16} />
          <span className="text-sm font-semibold">{language}</span>
        </button>

        {open ? (
          <div role="menu" aria-label="Language" className={styles.dockMenu}>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setLanguage("EN");
                setOpen(false);
              }}
              className={styles.dockMenuItem}
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
              className={styles.dockMenuItem}
            >
              FA
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
