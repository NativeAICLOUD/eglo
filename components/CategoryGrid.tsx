"use client"

import Image from "next/image"
import Link from "next/link"
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { ChevronRight } from "lucide-react"

const categories = [
  {
    key: "pendantLights",
    image: "https://pub-166082e4b3d54bb296c0e624eb1a1f50.r2.dev/products/romazzina_2.jpg",
    href: "/subcategory/pendant-lights",
  },
  {
    key: "ceilingLights",
    image: "https://pub-166082e4b3d54bb296c0e624eb1a1f50.r2.dev/products/deckenleuchte_4.jpg",
    href: "/subcategory/ceiling-lights",
  },
  {
    key: "wallLights",
    image: "https://pub-166082e4b3d54bb296c0e624eb1a1f50.r2.dev/products/Au_enwandleuchten_3.jpg",
    href: "/subcategory/wall-lamps",
  },
  {
    key: "tableLamps",
    image: "https://pub-166082e4b3d54bb296c0e624eb1a1f50.r2.dev/products/smart-light-web_8.jpg",
    href: "/subcategory/table-lamps",
  },
]

export function CategoryGrid() {
  const t = useTranslations('categoryGrid')
  const params = useParams()
  const locale = params.locale as string
  
  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900 mb-4">{t('title')}</h2>
          <p className="text-lg text-gray-500 font-light max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {categories.map((category, index) => (
            <Link key={index} href={`/${locale}${category.href}`} className="group block">
              <div className="relative overflow-hidden rounded-lg bg-gray-50 aspect-[3/4]">
                <Image
                  src={category.image || "/placeholder.svg"}
                  alt={t(`categories.${category.key}.title`)}
                  width={300}
                  height={500}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
              <div className="pt-5">
                <h3 className="text-lg font-medium text-gray-900 tracking-tight group-hover:text-teal-600 transition-colors">
                  {t(`categories.${category.key}.title`)}
                </h3>
                <p className="text-sm text-gray-500 font-light mt-1 leading-relaxed">
                  {t(`categories.${category.key}.description`)}
                </p>
                <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-teal-600 group-hover:gap-2 transition-all">
                  {t('shopNow')}
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
