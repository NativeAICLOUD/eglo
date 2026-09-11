'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

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

  // Optimistic selection so the pill slides the instant a language is picked,
  // before the route navigation resolves — mirrors the iOS toggle feel.
  const [pending, setPending] = useState<LocaleCode | null>(null);
  // Segment currently under the finger — grows while held / dragged.
  const [pressed, setPressed] = useState<LocaleCode | null>(null);
  const draggingRef = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const active = pending ?? currentLocale;
  const activeIndex = Math.max(0, LOCALES.findIndex((l) => l.code === active));

  useEffect(() => {
    if (pending && pending === currentLocale) setPending(null);
  }, [currentLocale, pending]);

  // Which language sits under a given horizontal screen position.
  const localeAtX = (clientX: number): LocaleCode => {
    const el = trackRef.current;
    if (!el) return active;
    const rect = el.getBoundingClientRect();
    const pad = 4; // p-1 → 0.25rem
    const inner = rect.width - pad * 2;
    let rel = clientX - rect.left - pad;
    rel = Math.max(0, Math.min(inner - 1, rel));
    const idx = Math.min(LOCALES.length - 1, Math.floor(rel / (inner / LOCALES.length)));
    return LOCALES[idx].code;
  };

  const commit = (newLocale: LocaleCode) => {
    if (newLocale === currentLocale) {
      setPending(null);
      return;
    }
    setPending(newLocale);
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const target = segments.join('/');
    // Let the pill finish sliding before the route swaps the page.
    setTimeout(() => router.push(target), 220);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    trackRef.current?.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    const code = localeAtX(e.clientX);
    setPressed(code);
    setPending(code);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const code = localeAtX(e.clientX);
    setPressed(code);
    setPending(code);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const code = localeAtX(e.clientX);
    setPressed(null);
    commit(code);
  };

  const onPointerCancel = () => {
    draggingRef.current = false;
    setPressed(null);
    setPending(null);
  };

  return (
    <div
      ref={trackRef}
      className="relative grid grid-cols-3 bg-gray-100/80 backdrop-blur-sm border border-white/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] rounded-full p-1 w-fit select-none touch-none cursor-pointer"
      role="tablist"
      aria-label="Language"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {/* Sliding pill — swells when the segment under the finger is active */}
      <span
        aria-hidden
        className="absolute top-1 bottom-1 left-1 rounded-full bg-green-100/80 backdrop-blur-md border border-white/90 shadow-md will-change-transform origin-center transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          width: `calc((100% - 0.5rem) / ${LOCALES.length})`,
          transform: `translateX(${activeIndex * 100}%) scale(${
            pressed && pressed === active ? 1.18 : 1
          })`,
        }}
      />
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          role="tab"
          aria-selected={active === code}
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') commit(code);
          }}
          className={`relative z-10 px-2.5 py-0.5 text-xs rounded-full font-medium origin-center transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] focus:outline-none ${
            pressed === code ? 'scale-125' : 'scale-100'
          } ${active === code ? 'text-green-700' : 'text-gray-500'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
