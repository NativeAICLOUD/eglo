"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "./Button"
import { Card, CardContent } from "./Card"
//import { Badge } from "./Badge"
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
    href: "/subcategory/wall-lights",
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
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('title')}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <Link key={index} href={`/${locale}${category.href}`} className="block">
              <Card className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="relative">
                  <Image
                    src={category.image || "/placeholder.svg"}
                    alt={t(`categories.${category.key}.title`)}
                    width={300}
                    height={500}
                    className="w-full h-96 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">
                    {t(`categories.${category.key}.title`)}
                  </h3>
                  <p className="text-gray-600 mb-4">{t(`categories.${category.key}.description`)}</p>
                  <Button variant="ghost" className="p-0 h-auto text-teal-600 hover:text-teal-700 font-semibold">
                    {t('shopNow')}
                    <ChevronRight className="ml-1 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
