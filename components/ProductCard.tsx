"use client"

import Link from "next/link"
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import productImagesMap from "../data/productImages.json"
import { formatMKD, getDiscountedPrice, trimmedImageSrc } from "../lib/api"
import { useCart } from "../app/[locale]/context/CartContext"

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
  const { addToCart } = useCart()

  const map = productImagesMap as Record<string, string[]>
  const r2Images = map[productDesc?.trim()] ?? map[productSlug ?? ''] ?? []
  const resolvedImage = r2Images.length > 0 ? r2Images[0] : (imageUrl || PLACEHOLDER)

  const hasDiscount = !!discountPercentage && discountPercentage > 0
  const finalPrice = hasDiscount ? getDiscountedPrice(price, discountPercentage) : price

  const handleAddToCart = (e: React.MouseEvent) => {
    // preventDefault stops the wrapping <Link>'s navigation directly (more
    // reliable than stopPropagation alone, which only blocks bubbling).
    e.preventDefault()
    e.stopPropagation()
    if (!productSlug) return
    addToCart({
      id: productSlug,
      name: productName,
      price: formatMKD(finalPrice),
      image: trimmedImageSrc(resolvedImage),
    })
  }

  const cardContent = (
    <div className="h-full flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      <div className="relative h-32 sm:h-48 flex-shrink-0 bg-white">
        <img
          src={trimmedImageSrc(resolvedImage)}
          alt={productName}
          className="block w-full h-full object-contain object-center p-2 sm:p-3 bg-white transition-opacity duration-300"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER }}
        />
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
        <div className="flex items-baseline gap-x-1.5 flex-wrap mb-2 sm:mb-3">
          <span className="text-sm sm:text-lg font-bold text-gray-900">{formatMKD(finalPrice)}</span>
          {hasDiscount && (
            <span className="text-xs sm:text-sm text-gray-400 line-through">{formatMKD(price)}</span>
          )}
        </div>
        <button
          className="btn-silver-glass mt-auto w-full h-9 sm:h-10 rounded-md text-xs sm:text-sm font-semibold whitespace-nowrap"
          onClick={handleAddToCart}
        >
          {t('addToCart')}
        </button>
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
