import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Bilingual, Lang } from '../types';
import { STRINGS, type StringKey } from './strings';

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Translate a UI dictionary key, with optional {placeholder} substitution. */
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
  /** Pick the active language from a Bilingual data object. */
  tr: (b: Bilingual) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');

  const t = useCallback(
    (key: StringKey, vars?: Record<string, string | number>) => {
      let s: string = STRINGS[key][lang];
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
      return s;
    },
    [lang],
  );
  const tr = useCallback((b: Bilingual) => b[lang], [lang]);

  const value = useMemo(() => ({ lang, setLang, t, tr }), [lang, t, tr]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <LanguageProvider>');
  return ctx;
}
