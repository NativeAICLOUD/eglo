"use client"

import Link from "next/link"
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

  const map = productImagesMap as Record<string, string[]>
  const r2Images = map[productDesc?.trim()] ?? map[productSlug ?? ''] ?? []
  const resolvedImage = r2Images.length > 0 ? r2Images[0] : (imageUrl || PLACEHOLDER)

  const hasDiscount = !!discountPercentage && discountPercentage > 0
  const finalPrice = hasDiscount ? getDiscountedPrice(price, discountPercentage) : price

  const cardContent = (
    <div className="h-full flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      <div className="relative h-32 sm:h-48 flex-shrink-0 bg-white">
        <img
          src={trimmedImageSrc(resolvedImage)}
          alt={productName}
          className="block w-full h-full object-contain object-center p-2 sm:p-3 bg-white"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER }}
        />
        {productSlug && (
          <FavoriteButton
            className="absolute top-2 right-2"
            product={{ id: productSlug, name: productName, sku: productDesc, price, discountPercentage, imageUrl: resolvedImage === PLACEHOLDER ? null : resolvedImage }}
          />
        )}
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          {isNew && (
            <span className="bg-blue-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-semibold">
              {t('new')}
            </span>
          )}
          {hasDiscount && (
            <span className="bg-red-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-semibold">
              -{Math.round(discountPercentage!)}%
            </span>
          )}
        </div>
      </div>
      <div className="p-2 sm:p-4 flex flex-col flex-1">
        <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 line-clamp-1">{productName}</h3>
        <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-1">{productDesc}</p>
        <div className="flex items-baseline gap-x-1.5 flex-wrap mt-auto">
          <span className="text-sm sm:text-lg font-bold text-gray-900">{formatMKD(finalPrice)}</span>
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
