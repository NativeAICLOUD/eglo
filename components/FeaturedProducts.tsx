"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "./Card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslations } from 'next-intl'
import { useParams } from "next/navigation"
import { useRef, useState, useEffect } from "react"
import { apiService, BackendProduct, parseProductName, formatMKD } from "../lib/api"

const PLACEHOLDER = "/placeholder.svg"

export function FeaturedProducts() {
  const t = useTranslations('featuredProducts')
  const params = useParams()
  const locale = params.locale as string
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [products, setProducts] = useState<BackendProduct[]>([])

  const CARD_WIDTH = 300
  const GAP = 24

  useEffect(() => {
    // Backend already sorts photographed products first, so this surfaces
    // real catalog items with real photos rather than placeholders.
    apiService.getProducts({ page: 1, pageSize: 10 })
      .then(res => setProducts(res.items))
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
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900 mb-2">{t('title')}</h2>
            <p className="text-gray-500 font-light text-base">{t('subtitle')}</p>
          </div>

          {/* Arrow buttons */}
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
            <Link key={product.id} href={`/${locale}/product/${product.id}`} className="flex-shrink-0">
              <Card
                className="group cursor-pointer border border-gray-200 rounded-xl bg-white hover:border-gray-300 hover:shadow-lg transition-all duration-300"
                style={{ width: CARD_WIDTH }}
              >
                <div className="relative h-64 overflow-hidden rounded-t-xl bg-gray-50">
                  <Image
                    src={product.imageUrl || PLACEHOLDER}
                    alt={parseProductName(product.title)}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="text-base font-medium text-gray-900 mb-2 group-hover:text-teal-600 transition-colors line-clamp-1">
                    {parseProductName(product.title)}
                  </h3>
                  <span className="text-lg font-semibold text-gray-900">{formatMKD(product.price)}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
