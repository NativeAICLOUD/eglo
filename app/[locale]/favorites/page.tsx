"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Heart } from "lucide-react"
import ProductCard from "../../../components/ProductCard"
import { useFavorites } from "../context/FavoritesContext"

export default function FavoritesPage() {
  const { locale } = useParams() as { locale: string }
  const t = useTranslations("favorites")
  const { items } = useFavorites()
  // Favorites live in localStorage, so render them only after mount to avoid a
  // server/client mismatch.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <Link href={`/${locale}`} className="hover:text-teal-600 transition-colors">{t("home")}</Link>
            <span>/</span>
            <span className="text-gray-700">{t("title")}</span>
          </div>
        </div>

        {!mounted ? null : items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-16 px-4 text-center">
            <Heart className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{t("emptyTitle")}</h2>
            <p className="text-gray-500 mb-6">{t("emptyText")}</p>
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {t("browse")}
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{t("count", { count: items.length })}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {items.map(item => (
                <ProductCard
                  key={item.id}
                  productName={item.name}
                  productDesc={item.sku}
                  price={item.price}
                  discountPercentage={item.discountPercentage}
                  imageUrl={item.imageUrl}
                  productSlug={item.id}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
