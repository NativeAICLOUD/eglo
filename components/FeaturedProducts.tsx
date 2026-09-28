"use client"

import Link from "next/link"
import ProductCard from "./ProductCard"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslations } from 'next-intl'
import { useParams } from "next/navigation"
import { useRef, useState, useEffect } from "react"
import { apiService, BackendProduct, parseProductName } from "../lib/api"
import { SectionHeading } from "./SectionHeading"

const SLIDER_PAGE_SIZE = 12

export function FeaturedProducts() {
  const t = useTranslations('newArrivals')
  const params = useParams()
  const locale = params.locale as string
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [products, setProducts] = useState<BackendProduct[]>([])
  const [showingNew, setShowingNew] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const loadingMore = useRef(false)

  const CARD_WIDTH = 300
  const GAP = 24

  useEffect(() => {
    // Products the admin marked NEW; the backend sorts photographed ones first.
    // Falls back to the general listing if nothing is marked yet.
    apiService.getProducts({ page: 1, pageSize: SLIDER_PAGE_SIZE, isNew: true })
      .then(async res => {
        if (res.items.length > 0) {
          setShowingNew(true)
          setTotal(res.totalCount)
          setProducts(res.items)
          return
        }
        const fallback = await apiService.getProducts({ page: 1, pageSize: 10 })
        setProducts(fallback.items)
      })
      .catch(() => setProducts([]))
  }, [])

  const loadMore = () => {
    if (!showingNew || loadingMore.current || products.length >= total) return
    loadingMore.current = true
    const next = page + 1
    apiService.getProducts({ page: next, pageSize: SLIDER_PAGE_SIZE, isNew: true })
      .then(res => {
        setProducts(prev => [...prev, ...res.items.filter(i => !prev.some(p => p.id === i.id))])
        setPage(next)
      })
      .catch(() => {})
      .finally(() => { loadingMore.current = false })
  }

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    const remaining = el.scrollWidth - (el.scrollLeft + el.clientWidth)
    setCanScrollRight(remaining > 1 || (showingNew && products.length < total))
    // Fetch the next batch while there are still a couple of cards left to scroll.
    if (remaining < (CARD_WIDTH + GAP) * 2) loadMore()
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener("scroll", checkScroll, { passive: true })
    return () => el.removeEventListener("scroll", checkScroll)
  }, [products, showingNew, total, page])

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === "left" ? -(CARD_WIDTH + GAP) : CARD_WIDTH + GAP, behavior: "smooth" })
  }

  if (products.length === 0) return null

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <SectionHeading title={t('title')} subtitle={t('subtitle')}>
          {showingNew && (
            <Link
              href={`/${locale}/new-products`}
              className="inline-block mt-3 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
            >
              {t('viewAllNew', { count: total })} →
            </Link>
          )}
        </SectionHeading>

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
