"use client"

import Link from "next/link"
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import productImagesMap from "../data/productImages.json"

const PLACEHOLDER = '/placeholder.svg'

interface ProductCardProps {
  productName: string
  productDesc: string
  productPrice: string
  imageUrl?: string | null
  productSlug?: string
}

export default function ProductCard({
  productName,
  productDesc,
  productPrice,
  imageUrl,
  productSlug
}: ProductCardProps) {
  const t = useTranslations('productCard')
  const params = useParams()
  const locale = params.locale as string

  const map = productImagesMap as Record<string, string[]>
  const r2Images = map[productDesc?.trim()] ?? map[productSlug ?? ''] ?? []
  const resolvedImage = r2Images.length > 0 ? r2Images[0] : (imageUrl || PLACEHOLDER)

  const cardContent = (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      <div className="relative h-48 bg-gray-100">
        <img
          src={resolvedImage}
          alt={productName}
          className="block object-cover w-full h-full transition-opacity duration-300"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER }}
        />
        <div className="absolute top-2 left-2">
          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">{t('new')}</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{productName}</h3>
        <p className="text-gray-600 text-sm mb-3">{productDesc}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">{productPrice}</span>
          <button
            className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition-colors"
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
