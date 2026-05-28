"use client"

import Link from "next/link"
import { ArrowRight, Lightbulb } from "lucide-react"
import { useTranslations } from 'next-intl'
import { useParams } from "next/navigation"

export function CTASection() {
  const t = useTranslations('ctaSection')
  const { locale } = useParams() as { locale: string }

  return (
    <section className="relative overflow-hidden bg-gray-900 py-20 md:py-28">
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-teal-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/15 px-4 py-1.5 mb-6">
            <Lightbulb className="w-4 h-4 text-teal-400" />
            <span className="text-sm font-medium text-teal-300">EGLO Smart Light</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5 leading-[1.1]">
            {t('title')}
          </h2>
          <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/category/indoor`}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-semibold text-base transition-colors"
            >
              {t('shopNow')}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={`/${locale}/about`}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/20 hover:bg-white/10 text-white font-semibold text-base transition-colors"
            >
              {t('learnMore')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
