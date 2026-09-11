"use client"

import Link from "next/link"
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import productImagesMap from "../data/productImages.json"
import { formatMKD, getDiscountedPrice } from "../lib/api"

const PLACEHOLDER = '/placeholder.svg'

const NEW_BADGE_WINDOW_DAYS = 30

interface ProductCardProps {
  productName: string
  productDesc: string
  price: number
  imageUrl?: string | null
  productSlug?: string
  createdDate?: string
  discountPercentage?: number | null
}

export default function ProductCard({
  productName,
  productDesc,
  price,
  imageUrl,
  productSlug,
  createdDate,
  discountPercentage
}: ProductCardProps) {
  const t = useTranslations('productCard')
  const params = useParams()
  const locale = params.locale as string

  const map = productImagesMap as Record<string, string[]>
  const r2Images = map[productDesc?.trim()] ?? map[productSlug ?? ''] ?? []
  const resolvedImage = r2Images.length > 0 ? r2Images[0] : (imageUrl || PLACEHOLDER)

  const isNew = !!createdDate && (Date.now() - new Date(createdDate).getTime()) < NEW_BADGE_WINDOW_DAYS * 24 * 60 * 60 * 1000
  const hasDiscount = !!discountPercentage && discountPercentage > 0
  const finalPrice = hasDiscount ? getDiscountedPrice(price, discountPercentage) : price

  const cardContent = (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      <div className="relative h-32 sm:h-48 bg-gray-100">
        <img
          src={resolvedImage}
          alt={productName}
          className="block object-cover w-full h-full transition-opacity duration-300"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER }}
        />
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          {isNew && (
            <span className="bg-blue-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">{t('new')}</span>
          )}
          {hasDiscount && (
            <span className="bg-red-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-semibold">
              -{Math.round(discountPercentage!)}%
            </span>
          )}
        </div>
      </div>
      <div className="p-2 sm:p-4">
        <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 line-clamp-1">{productName}</h3>
        <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-1">{productDesc}</p>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm sm:text-lg font-bold text-gray-900">{formatMKD(finalPrice)}</span>
            {hasDiscount && (
              <span className="text-xs sm:text-sm text-gray-400 line-through">{formatMKD(price)}</span>
            )}
          </span>
          <button
            className="bg-teal-600 text-white text-xs sm:text-base px-2 py-1 sm:px-4 sm:py-2 rounded hover:bg-teal-700 transition-colors whitespace-nowrap"
            onClick={(e) => e.stopPropagation()}
          >
            {t('addToCart')}
          </button>
        </div>
      </div>
    </div>
  )

  if (productSlug) {
    return (
      <Link href={`/${locale}/product/${productSlug}`} className="block">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}
