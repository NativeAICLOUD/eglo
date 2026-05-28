"use client"

import Image from "next/image"
import { Badge } from "./Badge"
import { Card, CardContent } from "./Card"
import { ChevronLeft, ChevronRight, Star } from "lucide-react"
import { useTranslations } from 'next-intl'
import { useRef, useState, useEffect } from "react"

const products = [
  {
    name: "Modern Brass Pendant",
    price: "18.390 ден.",
    originalPrice: "24.490 ден.",
    rating: 4.8,
    reviews: 124,
    image: "/assets/images/modern-brass-pendant.webp",
  },
  {
    name: "Industrial Ceiling Fan",
    price: "27.590 ден.",
    rating: 4.9,
    reviews: 89,
    image: "/assets/images/industrial-ceiling-fan.webp",
  },
  {
    name: "Smart LED Strip Kit",
    price: "4.890 ден.",
    rating: 4.7,
    reviews: 256,
    image: "/assets/images/Smart-LED-Strip-Kit.jpg",
  },
  {
    name: "Outdoor Wall Sconce",
    price: "9.790 ден.",
    rating: 4.6,
    reviews: 67,
    image: "/assets/images/Outdoor-Wall-Sconce.jpg",
  },
  {
    name: "Modern Brass Pendant",
    price: "18.390 ден.",
    originalPrice: "24.490 ден.",
    rating: 4.8,
    reviews: 124,
    image: "/assets/images/modern-brass-pendant.webp",
  },
  {
    name: "Industrial Ceiling Fan",
    price: "27.590 ден.",
    rating: 4.9,
    reviews: 89,
    image: "/assets/images/industrial-ceiling-fan.webp",
  },
]

export function FeaturedProducts() {
  const t = useTranslations('featuredProducts')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const CARD_WIDTH = 300
  const GAP = 24

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
  }, [])

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === "left" ? -(CARD_WIDTH + GAP) : CARD_WIDTH + GAP, behavior: "smooth" })
  }

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{t('title')}</h2>
            <p className="text-gray-500 text-base">{t('subtitle')}</p>
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
          {products.map((product, index) => (
            <Card
              key={index}
              className="group cursor-pointer border border-gray-200 rounded-xl bg-white hover:border-gray-300 hover:shadow-lg transition-all duration-300 flex-shrink-0"
              style={{ width: CARD_WIDTH }}
            >
              <div className="relative h-64 overflow-hidden rounded-t-xl">
                <Image
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {product.originalPrice && (
                  <Badge className="absolute top-3 right-3 bg-red-500 text-white text-xs">{t('sale')}</Badge>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors line-clamp-1">
                  {product.name}
                </h3>
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">({product.reviews})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">{product.price}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-gray-400 line-through">{product.originalPrice}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
