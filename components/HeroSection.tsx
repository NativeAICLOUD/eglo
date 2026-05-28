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
            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-3">
              {t('title')}
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-white/85 font-medium mb-5 leading-snug">
              {t('subtitle')}
            </p>

            {/* Sub-copy */}
            <p className="text-white/60 text-sm sm:text-base mb-8 max-w-sm leading-relaxed">
              {t('description')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/${locale}/category/indoor`}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm transition-colors backdrop-blur-sm"
              >
                {t('exploreCollection')}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={`/${locale}/about`}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-white/80 hover:text-white font-semibold text-sm transition-colors"
              >
                За нас
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
