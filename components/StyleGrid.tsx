"use client"

import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { SectionHeading } from "./SectionHeading"
import { ImageLinkCard } from "./ImageLinkCard"

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
    <section className="pt-10 md:pt-12 pb-12 md:pb-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <SectionHeading title={t('title')} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 lg:gap-x-8 gap-y-10">
          {styles.map((style) => (
            <ImageLinkCard
              key={style.key}
              href={`/${locale}/search?q=${encodeURIComponent(style.searchTerm)}`}
              image={style.image}
              title={t(`styles.${style.key}.title`)}
              description={t(`styles.${style.key}.description`)}
              cta={t('exploreStyle')}
              alt={`${t(`styles.${style.key}.title`)} style lighting`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
