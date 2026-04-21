// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// LANGUAGE PROVIDER
// ==========================================
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppLanguage, translate } from "./translations";

const LANGUAGE_KEY = "app:language:v1";

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (next: AppLanguage) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  speechLocale: string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("pt");

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then((stored) => {
        if (!mounted) return;
        if (stored === "pt" || stored === "en" || stored === "es") {
          setLanguageState(stored);
        }
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = async (next: AppLanguage) => {
    setLanguageState(next);
    await AsyncStorage.setItem(LANGUAGE_KEY, next);
  };

  const speechLocale = useMemo(() => {
    if (language === "en") return "en-US";
    if (language === "es") return "es-ES";
    return "pt-BR";
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      speechLocale,
      t: (key, params) => translate(language, key, params),
    }),
    [language, speechLocale],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
