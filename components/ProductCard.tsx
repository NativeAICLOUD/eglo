"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import productImagesMap from "../data/productImages.json"
import { formatMKD, getDiscountedPrice, trimmedImageSrc } from "../lib/api"
import { FavoriteButton } from "./FavoriteButton"

const PLACEHOLDER = '/placeholder.svg'

interface ProductCardProps {
  productName: string
  productDesc: string
  price: number
  imageUrl?: string | null
  productSlug?: string
  discountPercentage?: number | null
  isNew?: boolean
}

export default function ProductCard({
  productName,
  productDesc,
  price,
  imageUrl,
  productSlug,
  discountPercentage,
  isNew
}: ProductCardProps) {
  const t = useTranslations('productCard')
  const params = useParams()
  const locale = params.locale as string
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // An image already in the browser cache can finish before React attaches onLoad.
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true)
  }, [])

  const map = productImagesMap as Record<string, string[]>
  const r2Images = map[productDesc?.trim()] ?? map[productSlug ?? ''] ?? []
  const resolvedImage = r2Images.length > 0 ? r2Images[0] : (imageUrl || PLACEHOLDER)

  const hasDiscount = !!discountPercentage && discountPercentage > 0
  const finalPrice = hasDiscount ? getDiscountedPrice(price, discountPercentage) : price

  const cardContent = (
    <div className="group h-full flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:border-gray-200 hover:shadow-[0_12px_32px_-16px_rgba(15,23,42,0.22)] cursor-pointer">
      {/* Soft grey pulse while the photo loads, then it fades in — no blank white gaps while scrolling. */}
      <div className={`relative aspect-square overflow-hidden ${loaded ? "bg-white" : "bg-gray-100 animate-pulse"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={trimmedImageSrc(resolvedImage, 600)}
          loading="lazy"
          decoding="async"
          alt={productName}
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 w-full h-full object-contain p-4 sm:p-6 transition-[opacity,transform] duration-500 ease-out group-hover:scale-[1.03] ${loaded ? "opacity-100" : "opacity-0"}`}
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; setLoaded(true) }}
        />
        {productSlug && (
          <FavoriteButton
            className="absolute top-2 right-2"
            product={{ id: productSlug, name: productName, sku: productDesc, price, discountPercentage, imageUrl: resolvedImage === PLACEHOLDER ? null : resolvedImage }}
          />
        )}
        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1">
          {isNew && (
            <span className="bg-white/95 text-gray-900 border border-gray-200 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full">
              {t('new')}
            </span>
          )}
          {hasDiscount && (
            <span className="bg-rose-600 text-white text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full">
              -{Math.round(discountPercentage!)}%
            </span>
          )}
        </div>
      </div>
      <div className="px-3 sm:px-4 pt-3 pb-4 flex flex-col flex-1 border-t border-gray-50">
        <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-1 line-clamp-1">{productDesc}</p>
        {/* Two-line slot keeps prices aligned across a row. */}
        <h3 className="text-sm sm:text-[15px] font-medium text-gray-900 leading-snug line-clamp-2 min-h-[2.5em] transition-colors group-hover:text-teal-700">{productName}</h3>
        <div className="mt-auto pt-2 flex items-baseline gap-x-2 flex-wrap">
          <span className="text-[15px] sm:text-base font-semibold text-gray-900">{formatMKD(finalPrice)}</span>
          {hasDiscount && (
            <span className="text-xs sm:text-sm text-gray-400 line-through">{formatMKD(price)}</span>
          )}
        </div>
      </div>
    </div>
  )

  if (productSlug) {
    return (
      <Link href={`/${locale}/product/${productSlug}`} className="block h-full">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}
