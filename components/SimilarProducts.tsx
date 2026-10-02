"use client"

import ProductCard from "./ProductCard"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslations } from 'next-intl'
import { useRef, useState, useEffect } from "react"
import { apiService, BackendProduct, parseProductName } from "../lib/api"
import { SectionHeading } from "./SectionHeading"

interface SimilarProductsProps {
  productId: string
  categoryId?: string | null
  subcategoryId?: string | null
  categoryName?: string | null
}

const MAX_ITEMS = 12

// Slider of other products from the same subcategory, topped up from the
// parent category when the subcategory alone is too small.
export function SimilarProducts({ productId, categoryId, subcategoryId, categoryName }: SimilarProductsProps) {
  const t = useTranslations('productPage.similarProducts')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [products, setProducts] = useState<BackendProduct[]>([])

  const CARD_WIDTH = 300
  const GAP = 24

  useEffect(() => {
    let cancelled = false
    setProducts([])

    async function load() {
      const found: BackendProduct[] = []
      const seen = new Set([productId])
      // The backend's CategoryId filter matches both root categories and subcategories.
      for (const id of [subcategoryId, categoryId]) {
        if (!id || found.length >= MAX_ITEMS) continue
        const page = await apiService.getProducts({ categoryId: id, page: 1, pageSize: MAX_ITEMS + 1 })
        for (const p of page.items) {
          if (seen.has(p.id) || found.length >= MAX_ITEMS) continue
          seen.add(p.id)
          found.push(p)
        }
      }
      if (!cancelled) setProducts(found)
    }

    load().catch(() => { if (!cancelled) setProducts([]) })
    return () => { cancelled = true }
  }, [productId, categoryId, subcategoryId])

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollLeft = 0
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
        <SectionHeading
          title={t('title')}
          subtitle={categoryName ? t('subtitle', { category: categoryName }) : undefined}
        />

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
