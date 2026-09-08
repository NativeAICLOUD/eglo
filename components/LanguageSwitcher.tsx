'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const LOCALES = [
  { code: 'mk', label: 'mk' },
  { code: 'sq', label: 'shq' },
  { code: 'en', label: 'en' },
] as const;

type LocaleCode = (typeof LOCALES)[number]['code'];

export default function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] as LocaleCode;

  // Optimistic selection so the pill slides the instant a language is tapped,
  // before the route navigation resolves — mirrors the iOS toggle feel.
  const [pending, setPending] = useState<LocaleCode | null>(null);
  const active = pending ?? currentLocale;
  const activeIndex = Math.max(0, LOCALES.findIndex((l) => l.code === active));

  useEffect(() => {
    if (pending && pending === currentLocale) setPending(null);
  }, [currentLocale, pending]);

  const switchLocale = (newLocale: LocaleCode) => {
    if (newLocale === active) return;
    setPending(newLocale);
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const target = segments.join('/');
    // Let the pill finish sliding before the route swaps the page, so the
    // iOS-style toggle animation is always visible.
    setTimeout(() => router.push(target), 220);
  };

  return (
    <div
      className="relative grid grid-cols-3 bg-gray-100 rounded-full p-1 w-fit select-none touch-manipulation"
      role="tablist"
      aria-label="Language"
    >
      {/* Sliding pill */}
      <span
        aria-hidden
        className="absolute top-1 bottom-1 left-1 rounded-full bg-teal-600 shadow-sm will-change-transform transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          width: `calc((100% - 0.5rem) / ${LOCALES.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          role="tab"
          aria-selected={active === code}
          onClick={() => switchLocale(code)}
          className={`relative z-10 px-4 py-1 rounded-full text-sm font-medium transition-colors duration-300 focus:outline-none active:scale-95 ${
            active === code ? 'text-white' : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
