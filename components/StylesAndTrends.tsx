"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { STYLE_TRENDS } from "../lib/stylesAndTrends"

const EASE = "ease-[cubic-bezier(0.22,0.61,0.36,1)]"

// Edge-to-edge 3×2 photo grid (2 columns on tablet, 1 on mobile). The whole photo is the
// link; the style name sits over it in white with an arrow.
export function StylesAndTrends() {
  const t = useTranslations('stylesAndTrends')
  const params = useParams()
  const locale = params.locale as string

  return (
    <section aria-labelledby="styles-trends-heading" className="bg-white pb-12 md:pb-16">
      <div className="pt-10 pb-8 md:pt-14 md:pb-10 px-4 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#94A3B8]">{t('eyebrow')}</p>
        <h2
          id="styles-trends-heading"
          className="mt-3 text-[26px] lg:text-[32px] leading-tight font-light tracking-[-0.01em] text-[#64748B]"
        >
          {t('title')}
        </h2>
        <span aria-hidden="true" className="mx-auto mt-5 block h-px w-12 bg-[#CBD5E1]" />
      </div>

      {/* Negative margins cancel the page padding (as in HeroSection) so the photos run edge to edge. */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 -mx-4 md:-mx-6 lg:-mx-8">
        {STYLE_TRENDS.map((style) => (
          <li key={style.id}>
            <Link
              href={`/${locale}/search?q=${encodeURIComponent(style.searchTerm)}&style=${style.id}`}
              className="group relative block aspect-[1/1.05] overflow-hidden bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
            >
              {/* A light shared grade keeps six different shoots looking like one set; full colour returns on hover. */}
              <Image
                src={style.image}
                alt={t(`styles.${style.id}.alt`)}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                style={{ objectPosition: style.objectPosition }}
                className={`object-cover saturate-[0.9] transition-[scale,filter] duration-700 ${EASE} group-hover:saturate-100 motion-safe:group-hover:scale-[1.03]`}
              />
              {/* Soft glow behind the label rather than a flat band, so the photo stays clean elsewhere. */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_45%_at_0%_57%,rgba(0,0,0,0.42),transparent)]" />
              <div className={`absolute inset-0 bg-black/0 transition-colors duration-500 ${EASE} group-hover:bg-black/15`} />
              <div
                aria-hidden="true"
                className={`absolute inset-4 lg:inset-5 border border-white/50 opacity-0 transition-opacity duration-500 ${EASE} group-hover:opacity-100 group-focus-visible:opacity-100`}
              />

              <span className="absolute inset-x-0 top-[57%] -translate-y-1/2 px-7 lg:px-9 text-white [text-shadow:0_1px_12px_rgba(0,0,0,0.3)]">
                <span className="flex items-center gap-3 text-[22px] lg:text-[26px] font-light tracking-[0.01em] leading-tight">
                  {t(`styles.${style.id}.title`)}
                  <ArrowRight
                    aria-hidden="true"
                    strokeWidth={1.25}
                    className={`w-5 h-5 shrink-0 transition-transform duration-500 ${EASE} motion-safe:group-hover:translate-x-1`}
                  />
                </span>
                <span
                  aria-hidden="true"
                  className={`mt-3 block h-px w-8 bg-white/80 transition-[width] duration-500 ${EASE} group-hover:w-16`}
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
