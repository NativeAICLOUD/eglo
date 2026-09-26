"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'

const styles = [
  {
    key: "scandinavian",
    image: "/assets/images/scandinavian.jpg",
    searchTerm: "Scandinavian",
  },
  {
    key: "natural",
    image: "/assets/images/natural.jpg",
    searchTerm: "Natural",
  },
  {
    key: "vintage",
    image: "/assets/images/vintage-retro.jpg",
    searchTerm: "Vintage",
  },
  {
    key: "industrial",
    image: "/assets/images/industrial-2_3.jpg",
    searchTerm: "Industrial",
  },
]

export function StyleGrid() {
  const t = useTranslations('styleGrid')
  const params = useParams()
  const locale = params.locale as string

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="pt-2 text-[1.75rem] sm:text-4xl lg:text-5xl leading-tight font-extrabold uppercase tracking-wide text-[#5b6b7d] break-words">{t('title')}</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
          {styles.map((style, index) => (
            <Link
              key={index}
              href={`/${locale}/search?q=${encodeURIComponent(style.searchTerm)}`}
              className="group cursor-pointer h-full block"
            >
              {/* Card Container with Border */}
              <div className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-lg transition-all duration-300 h-full flex flex-col" style={{ backgroundColor: '#f4f2f1' }}>
                {/* Image Container */}
                <div className="relative h-72 mb-4 overflow-hidden rounded-lg bg-gray-50">
                  <Image
                    src={style.image || "/placeholder.svg"}
                    alt={`${t(`styles.${style.key}.title`)} style lighting`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  {/* Hover Content */}
                  <div className="absolute bottom-4 left-4 right-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="flex items-center justify-between text-white">
                      <span className="font-medium text-sm">{t('exploreStyle')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Text Content */}
                <div className="text-center px-2 flex-1 flex flex-col">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors duration-300">
                    {t(`styles.${style.key}.title`)}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed flex-1">{t(`styles.${style.key}.description`)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
