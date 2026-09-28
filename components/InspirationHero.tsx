"use client"

import { Lightbulb, ArrowDown } from "lucide-react"
import { Button } from "./Button"
import Image from "next/image"
import { useTranslations } from 'next-intl'

export function InspirationHero() {
  const t = useTranslations('inspirationHero')
  
  return (
    <section className="relative h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-white">
      {/* Background Images with Parallax Effect */}
      <div className="absolute inset-0 grid grid-cols-3 gap-4 p-8 z-10 pointer-events-auto">
        <div className="space-y-4">
          <div className="h-32 rounded-lg overflow-hidden group opacity-20 hover:opacity-100 transition-opacity duration-300">
            <Image
              src="/assets/images/colored-lighting.jpg"
              alt=""
              width={200}
              height={128}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="h-48 rounded-lg overflow-hidden group opacity-20 hover:opacity-100 transition-opacity duration-300">
            <Image
              src="/assets/images/vintage-retro copy.jpg"
              alt=""
              width={200}
              height={192}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="h-24 rounded-lg overflow-hidden group opacity-20 hover:opacity-100 transition-opacity duration-300">
            <Image
              src="/assets/images/vintage-lightning.webp"
              alt=""
              width={200}
              height={96}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-40 rounded-lg overflow-hidden group opacity-20 hover:opacity-100 transition-opacity duration-300">
            <Image
              src="/assets/images/bohemian-living.png"
              alt=""
              width={200}
              height={160}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="h-32 rounded-lg overflow-hidden group opacity-20 hover:opacity-100 transition-opacity duration-300">
            <Image
              src="/assets/images/modern-bathroom.png"
              alt=""
              width={200}
              height={128}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="h-56 rounded-lg overflow-hidden group opacity-20 hover:opacity-100 transition-opacity duration-300">
            <Image
              src="/assets/images/led-inspiration.jpg"
              alt=""
              width={200}
              height={224}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-28 rounded-lg overflow-hidden group opacity-20 hover:opacity-100 transition-opacity duration-300">
            <Image
              src="/assets/images/industrial-lighting.avif"
              alt=""
              width={200}
              height={112}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="h-44 rounded-lg overflow-hidden group opacity-20 hover:opacity-100 transition-opacity duration-300">
            <Image
              src="/assets/images/outdoor-inspiration.jpg"
              alt=""
              width={200}
              height={176}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="h-36 rounded-lg overflow-hidden group opacity-20 hover:opacity-100 transition-opacity duration-300">
            <Image
              src="/assets/images/office-inspiration.webp"
              alt=""
              width={200}
              height={144}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-20 flex items-center justify-center h-full px-4 pt-20 pointer-events-none">
        <div className="text-center max-w-4xl -mt-60">
          <div className="flex items-center justify-center gap-3 mb-6 animate-fade-in">
            <Lightbulb className="w-8 h-8 text-teal-600 animate-pulse" />
            <span className="text-teal-600 font-semibold uppercase tracking-wide">{t('lightingInspiration')}</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 animate-slide-up">
            {t('title')}
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed animate-slide-up delay-200">
            {t('subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-slide-up delay-300 pointer-events-auto">
            <Button size="lg" className="bg-teal-600 hover:bg-teal-700 px-8 py-4 text-lg">
              {t('exploreIdeas')}
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-4 text-lg bg-transparent">
              {t('getConsultation')}
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ArrowDown className="w-6 h-6 text-gray-400" />
      </div>
    </section>
  )
}
