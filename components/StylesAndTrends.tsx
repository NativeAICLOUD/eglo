"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { STYLE_TRENDS } from "../lib/stylesAndTrends"

// Edge-to-edge 3×2 photo grid (2 columns on tablet, 1 on mobile). The whole photo is the
// link; the style name sits over it in white with an arrow.
export function StylesAndTrends() {
  const t = useTranslations('stylesAndTrends')
  const params = useParams()
  const locale = params.locale as string

  return (
    <section aria-labelledby="styles-trends-heading" className="bg-white pb-12 md:pb-16">
      <h2
        id="styles-trends-heading"
        className="py-8 px-4 text-center text-2xl lg:text-[28px] leading-tight font-normal text-[#64748B]"
      >
        {t('title')}
      </h2>

      {/* Negative margins cancel the page padding (as in HeroSection) so the photos run edge to edge. */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 -mx-4 md:-mx-6 lg:-mx-8">
        {STYLE_TRENDS.map((style) => (
          <li key={style.id}>
            <Link
              href={`/${locale}/search?q=${encodeURIComponent(style.searchTerm)}&style=${style.id}`}
              className="group relative block aspect-[1/1.05] overflow-hidden bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
            >
              <Image
                src={style.image}
                alt={t(`styles.${style.id}.alt`)}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                style={{ objectPosition: style.objectPosition }}
                className="object-cover transition-transform duration-[400ms] ease-out motion-safe:group-hover:scale-[1.03]"
              />
              {/* Soft shade from the left edge, only where the label sits, so pale photos keep the white text readable. */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/15 to-transparent" />
              <div className="absolute inset-0 bg-black/0 transition-colors duration-[400ms] group-hover:bg-black/10" />

              <span className="absolute inset-x-0 top-[55%] -translate-y-1/2 flex items-center gap-2 px-6 lg:px-8 text-lg lg:text-[22px] font-medium text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.35)]">
                {t(`styles.${style.id}.title`)}
                <ArrowRight
                  aria-hidden="true"
                  className="w-5 h-5 shrink-0 transition-transform duration-[400ms] ease-out motion-safe:group-hover:translate-x-1"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
