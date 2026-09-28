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
          src="/assets/images/banner.webp"
          alt="Modern living room with elegant lighting"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Warm dark-brown gradient on the left keeps the text readable and in the banner's palette */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#24150c]/75 via-[#24150c]/35 to-transparent" />
      </div>

      {/* Content — left-aligned */}
      <div className="relative h-full flex items-center px-6 md:px-10 lg:px-16 pt-16 sm:pt-0">
        <div className="max-w-7xl mx-auto w-full">
          <div className="max-w-xl">
            {/* Kicker */}
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-8 bg-[#e3c29b]/80" />
              <p className="text-[#e3c29b] text-xs sm:text-sm font-medium uppercase tracking-[0.28em]">
                {t('subtitle')}
              </p>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-semibold text-[#fbf3e8] leading-[1.1] tracking-tight mb-6">
              {t('title')}
            </h1>

            {/* Sub-copy */}
            <p className="text-[#efdcc6]/90 text-base sm:text-lg mb-10 max-w-md leading-relaxed font-light">
              {t('description')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
              <Link
                href={`/${locale}/category/interior-lights`}
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-[#fbf3e8] hover:bg-[#fffaf3] text-[#3b2416] font-semibold text-sm tracking-wide transition-all hover:-translate-y-0.5"
              >
                {t('exploreCollection')}
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href={`/${locale}/about`}
                className="inline-flex w-fit items-center justify-center px-2 py-4 text-[#fbf3e8]/90 hover:text-[#fbf3e8] font-medium text-sm tracking-wide transition-colors border-b border-transparent hover:border-[#fbf3e8]/60"
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
