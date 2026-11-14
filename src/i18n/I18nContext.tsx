import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  TRANSLATIONS,
  getInitialLang,
  getLangDir,
  persistLang,
  type AppLang,
  type TranslationDict,
} from './translations';

interface I18nContextValue {
  lang: AppLang;
  setLang: (lang: AppLang) => void;
  dir: 'rtl' | 'ltr';
  t: TranslationDict;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function applyDocumentLangDir(lang: AppLang): void {
  if (typeof document === 'undefined') return;
  const dir = getLangDir(lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = dir;
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<AppLang>(() => {
    const initial = getInitialLang();
    applyDocumentLangDir(initial);
    return initial;
  });

  useEffect(() => {
    applyDocumentLangDir(lang);
    persistLang(lang);
  }, [lang]);

  const setLang = (next: AppLang) => {
    applyDocumentLangDir(next);
    persistLang(next);
    setLangState(next);
  };

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      dir: getLangDir(lang),
      t: TRANSLATIONS[lang],
    }),
    [lang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
