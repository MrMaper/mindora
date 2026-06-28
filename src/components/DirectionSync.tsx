"use client";

import * as React from "react";
import type { Language } from "@/types/db";

interface DirectionSyncProps {
  language: Language;
}

export function DirectionSync({ language }: DirectionSyncProps) {
  React.useEffect(() => {
    const dir = language === "FA" ? "rtl" : "ltr";
    const lang = language === "FA" ? "fa" : "en";
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [language]);

  return null;
}
