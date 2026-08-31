'use client';

import { useRouter, usePathname } from 'next/navigation';

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

  const switchLocale = (newLocale: LocaleCode) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  };

  return (
    <div className="flex items-center bg-gray-100 rounded-full p-1 w-fit">
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => switchLocale(code)}
          className={`px-4 py-1 rounded-full text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-600 ${
            currentLocale === code
              ? 'bg-teal-600 text-white shadow'
              : 'bg-transparent text-gray-700 hover:bg-gray-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
