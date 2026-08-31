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
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />
      </div>

      {/* Content — left-aligned */}
      <div className="relative h-full flex items-center px-6 md:px-10 lg:px-16 pt-16 sm:pt-0">
        <div className="max-w-7xl mx-auto w-full">
          <div className="max-w-lg">
            {/* Kicker */}
            <p className="text-white/70 text-xs sm:text-sm font-medium uppercase tracking-[0.25em] mb-4">
              {t('subtitle')}
            </p>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium text-white leading-[1.15] tracking-tight mb-6">
              {t('title')}
            </h1>

            {/* Sub-copy */}
            <p className="text-white/60 text-sm sm:text-base mb-10 max-w-sm leading-relaxed font-light">
              {t('description')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
              <Link
                href={`/${locale}/category/interior-lights`}
                className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium text-sm tracking-wide transition-colors backdrop-blur-sm"
              >
                {t('exploreCollection')}
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={`/${locale}/about`}
                className="inline-flex w-fit items-center justify-center px-1 py-3.5 text-white/80 hover:text-white font-medium text-sm tracking-wide transition-colors border-b border-transparent hover:border-white/50"
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
