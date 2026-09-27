"use client"

import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { SectionHeading } from "./SectionHeading"
import { ImageLinkCard } from "./ImageLinkCard"

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
    <section className="pt-12 md:pt-16 pb-10 md:pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <SectionHeading title={t('title')} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 lg:gap-x-8 gap-y-10">
          {categories.map((category) => (
            <ImageLinkCard
              key={category.key}
              href={`/${locale}${category.href}`}
              image={category.image}
              title={t(`categories.${category.key}.title`)}
              description={t(`categories.${category.key}.description`)}
              cta={t('shopNow')}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
