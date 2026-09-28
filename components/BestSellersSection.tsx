"use client"

import ProductCard from "./ProductCard"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslations } from 'next-intl'
import { useRef, useState, useEffect } from "react"
import { apiService, BackendProduct, parseProductName } from "../lib/api"
import { SectionHeading } from "./SectionHeading"

export function BestSellersSection() {
  const t = useTranslations('featuredProducts')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [products, setProducts] = useState<BackendProduct[]>([])

  const CARD_WIDTH = 300
  const GAP = 24

  useEffect(() => {
    // Best sellers are ranked by units sold. Until there are orders the list is
    // empty, so fill the section with catalog products that have a photo —
    // skipping NEW ones, which already have their own section below.
    apiService.getBestSellers(10)
      .then(async sold => {
        if (sold.length > 0) return sold
        const page = await apiService.getProducts({ page: 1, pageSize: 40 })
        return page.items.filter(p => p.imageUrl && !p.isNew).slice(0, 10)
      })
      .then(setProducts)
      .catch(() => setProducts([]))
  }, [])

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener("scroll", checkScroll, { passive: true })
    return () => el.removeEventListener("scroll", checkScroll)
  }, [products])

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === "left" ? -(CARD_WIDTH + GAP) : CARD_WIDTH + GAP, behavior: "smooth" })
  }

  if (products.length === 0) return null

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <SectionHeading title={t('title')} subtitle={t('subtitle')} />

        {/* Arrow buttons */}
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-teal-500 hover:text-teal-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-teal-500 hover:text-teal-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slider */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scroll-smooth pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((product) => (
            <div key={product.id} className="flex-shrink-0" style={{ width: CARD_WIDTH }}>
              <ProductCard
                productName={parseProductName(product.title)}
                productDesc={product.sku}
                price={product.price}
                discountPercentage={product.discountPercentage}
                isNew={product.isNew}
                imageUrl={product.imageUrl}
                productSlug={product.id}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
