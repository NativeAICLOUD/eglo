'use client';

import { useRouter, usePathname } from 'next/navigation';

export default function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] as 'mk' | 'sq';

  const switchLocale = (newLocale: 'mk' | 'sq') => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  };

  return (
    <div className="flex items-center bg-gray-100 rounded-full p-1 w-fit">
      <button
        onClick={() => switchLocale('mk')}
        className={`px-4 py-1 rounded-full text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-600 ${
          currentLocale === 'mk'
            ? 'bg-teal-600 text-white shadow'
            : 'bg-transparent text-gray-700 hover:bg-gray-200'
        }`}
      >
        mk
      </button>
      <button
        onClick={() => switchLocale('sq')}
        className={`px-4 py-1 rounded-full text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-600 ${
          currentLocale === 'sq'
            ? 'bg-teal-600 text-white shadow'
            : 'bg-transparent text-gray-700 hover:bg-gray-200'
        }`}
      >
        shq
      </button>
    </div>
  );
}
