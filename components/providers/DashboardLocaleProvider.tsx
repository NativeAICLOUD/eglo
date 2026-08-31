'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { timeZone } from '../../i18n';
import enMessages from '../../messages/en.json';
import mkMessages from '../../messages/mk.json';
import sqMessages from '../../messages/sq.json';

const DASHBOARD_LOCALES = ['en', 'mk', 'sq'] as const;
type DashboardLocale = (typeof DASHBOARD_LOCALES)[number];

const MESSAGES: Record<DashboardLocale, Record<string, unknown>> = {
  en: enMessages,
  mk: mkMessages,
  sq: sqMessages,
};

const STORAGE_KEY = 'dashboard_locale';

interface DashboardLocaleContextValue {
  locale: DashboardLocale;
  setLocale: (locale: DashboardLocale) => void;
}

const DashboardLocaleContext = createContext<DashboardLocaleContextValue | null>(null);

export function useDashboardLocale() {
  const ctx = useContext(DashboardLocaleContext);
  if (!ctx) throw new Error('useDashboardLocale must be used within DashboardLocaleProvider');
  return ctx;
}

// The admin dashboard defaults to English regardless of the site's URL
// locale (mk/sq/en), since it's an internal tool. Admins can still switch
// to Macedonian or Albanian from within the dashboard; the choice is
// remembered locally and is independent of the public site's language.
export default function DashboardLocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<DashboardLocale>('en');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (DASHBOARD_LOCALES as readonly string[]).includes(saved)) {
      setLocaleState(saved as DashboardLocale);
    }
  }, []);

  const setLocale = (next: DashboardLocale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <DashboardLocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone={timeZone}>
        {children}
      </NextIntlClientProvider>
    </DashboardLocaleContext.Provider>
  );
}
