"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import ProductCard from "../../../components/ProductCard"
import { apiService, BackendProduct, parseProductName } from "../../../lib/api"

const PAGE_SIZE = 24

export default function NewProductsPage() {
  const { locale } = useParams() as { locale: string }
  const t = useTranslations("newArrivals")
  const [products, setProducts] = useState<BackendProduct[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const loadPage = useCallback(async (next: number) => {
    setLoading(true)
    setError(false)
    try {
      const res = await apiService.getProducts({ page: next, pageSize: PAGE_SIZE, isNew: true })
      setProducts(prev => (next === 1 ? res.items : [...prev, ...res.items]))
      setTotalCount(res.totalCount)
      setPage(next)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadPage(1) }, [loadPage])

  const hasMore = products.length < totalCount

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-500 mt-1">{t("subtitle")}</p>
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
            <Link href={`/${locale}`} className="hover:text-teal-600 transition-colors">{t("home")}</Link>
            <span>/</span>
            <span className="text-gray-700">{t("title")}</span>
          </div>
        </div>

        {products.length > 0 && (
          <p className="text-sm text-gray-500 mb-4">{t("showing", { shown: products.length, total: totalCount })}</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {products.map(product => (
            <ProductCard
              key={product.id}
              productName={parseProductName(product.title)}
              productDesc={product.sku}
              price={product.price}
              discountPercentage={product.discountPercentage}
              isNew={product.isNew}
              imageUrl={product.imageUrl}
              productSlug={product.id}
            />
          ))}
        </div>

        {error && (
          <p className="mt-6 text-center text-sm text-red-600">{t("loadError")}</p>
        )}

        {!loading && !error && products.length === 0 && (
          <p className="py-16 text-center text-gray-400">{t("empty")}</p>
        )}

        {(hasMore || loading) && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => loadPage(page + 1)}
              disabled={loading}
              className="px-8 py-3 bg-white border border-gray-300 hover:border-teal-500 hover:text-teal-600 text-sm font-medium text-gray-700 rounded-lg transition-colors disabled:opacity-60 inline-flex items-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />}
              {loading ? t("loading") : t("loadMore")}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
