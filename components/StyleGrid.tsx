"use client"

import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { SectionHeading } from "./SectionHeading"
import { ImageLinkCard } from "./ImageLinkCard"

// searchTerm is an EGLO material keyword from the product titles that fits the style —
// the style names themselves never appear in titles, so searching them found nothing.
const styles = [
  {
    key: "scandinavian",
    image: "/assets/images/scandinavian.jpg",
    searchTerm: "HOLZ",   // wood
  },
  {
    key: "natural",
    image: "/assets/images/natural.jpg",
    searchTerm: "NATUR",  // natural linen, rattan and wood finishes
  },
  {
    key: "vintage",
    image: "/assets/images/vintage-retro.jpg",
    searchTerm: "ANTIK",  // antique copper / brass finishes
  },
  {
    key: "industrial",
    image: "/assets/images/industrial-2_3.jpg",
    searchTerm: "KUPFER", // black-and-copper metal pendants
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
              href={`/${locale}/search?q=${encodeURIComponent(style.searchTerm)}&style=${style.key}`}
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
