"use client"

import Image from "next/image"
import { TrendingUp, Clock, Users } from "lucide-react"
import { useTranslations } from 'next-intl'

const trendingIdeas = [
  {
    key: "smartLightingAutomation",
    image: "/assets/images/smart-home-lighting.jpg",
    views: "2.1k",
  },
  {
    key: "layeredLightingDesign",
    image: "/assets/images/layered-lighting.png",
    views: "1.8k",
  },
  {
    key: "sustainableLedSolutions",
    image: "/assets/images/sustainable-led-lighting.jpg",
    views: "1.2k",
  },
]

export function TrendingIdeas() {
  const t = useTranslations('trendingIdeasSection')

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-teal-600" />
            <span className="text-teal-600 font-semibold uppercase tracking-wide text-sm">{t('trending')}</span>
          </div>
          <h2 className="text-4xl font-medium tracking-tight text-gray-900 mb-4">{t('title')}</h2>
          <p className="text-lg text-gray-500 font-light max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {trendingIdeas.map((idea, index) => (
            <article key={index} className="group cursor-pointer">
              <div className="relative h-64 rounded-xl overflow-hidden mb-6">
                <Image
                  src={idea.image || "/placeholder.svg"}
                  alt={t(`ideas.${idea.key}.title`)}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-teal-600 transition-colors duration-300">
                  {t(`ideas.${idea.key}.title`)}
                </h3>
                <p className="text-gray-600 leading-relaxed">{t(`ideas.${idea.key}.description`)}</p>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {t(`ideas.${idea.key}.readTime`)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {idea.views} {t('views')}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
