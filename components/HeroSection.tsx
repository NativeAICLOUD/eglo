"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useTranslations } from 'next-intl'
import { useParams } from "next/navigation"

export function HeroSection() {
  const t = useTranslations('heroSection')
  const { locale } = useParams() as { locale: string }

  return (
    <section className="relative min-h-[540px] sm:h-[640px] overflow-hidden -mx-4 md:-mx-6 lg:-mx-8">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/assets/images/banner.png"
          alt="Modern living room with elegant lighting"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Stronger left-side gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
      </div>

      {/* Content — left-aligned */}
      <div className="relative h-full flex items-center px-6 md:px-10 lg:px-16 pt-16 sm:pt-0">
        <div className="max-w-7xl mx-auto w-full">
          <div className="max-w-xl">
            {/* Kicker */}
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-8 bg-teal-400/80" />
              <p className="text-teal-200/90 text-xs sm:text-sm font-medium uppercase tracking-[0.28em]">
                {t('subtitle')}
              </p>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-semibold text-white leading-[1.1] tracking-tight mb-6">
              {t('title')}
            </h1>

            {/* Sub-copy */}
            <p className="text-white/80 text-base sm:text-lg mb-10 max-w-md leading-relaxed font-light">
              {t('description')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
              <Link
                href={`/${locale}/category/interior-lights`}
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-white hover:bg-white/95 text-gray-900 font-semibold text-sm tracking-wide transition-all hover:-translate-y-0.5"
              >
                {t('exploreCollection')}
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href={`/${locale}/about`}
                className="inline-flex w-fit items-center justify-center px-2 py-4 text-white/90 hover:text-white font-medium text-sm tracking-wide transition-colors border-b border-transparent hover:border-white/60"
              >
                {t('aboutUs')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
