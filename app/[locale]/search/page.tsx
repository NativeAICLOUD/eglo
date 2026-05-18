"use client"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, useCallback, Suspense } from "react"
import ProductCard from "../../../components/ProductCard"
import { Input } from "../../../components/Input"
import { Button } from "../../../components/Button"
import { Search } from "lucide-react"
import Link from "next/link"
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { apiService, BackendProduct, parseProductName, formatMKD } from "../../../lib/api"

function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get("q") || ""
  const [searchTerm, setSearchTerm] = useState(query)
  const [filteredProducts, setFilteredProducts] = useState<BackendProduct[]>([])
  const [loading, setLoading] = useState(false)
  const t = useTranslations('search')
  const params = useParams()
  const locale = params.locale as string

  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setFilteredProducts([])
      return
    }
    setLoading(true)
    apiService.getProducts({ search: searchQuery.trim(), pageSize: 100 })
      .then(data => { setFilteredProducts(data.items); setLoading(false) })
      .catch(() => { setFilteredProducts([]); setLoading(false) })
  }, [])

  useEffect(() => {
    if (query) {
      performSearch(query)
    }
  }, [query, performSearch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      // Use Next.js router to navigate with search params
      const searchUrl = `/${locale}/search?q=${encodeURIComponent(searchTerm.trim())}`
      router.push(searchUrl)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="h-48 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {query ? t('results.title', { query }) : t('title')}
          </h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder={t('search.placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-3 border-gray-200 focus:border-teal-500 focus:ring-teal-500 w-full"
              />
              <Button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                size="sm"
              >
                {t('search.button')}
              </Button>
            </div>
          </form>
        </div>

        {/* Results */}
        {query && (
          <div className="mb-6">
            <p className="text-gray-600">
              {filteredProducts.length === 0 
                ? t('results.noProducts') 
                : t('results.found', { count: filteredProducts.length })
              }
            </p>
          </div>
        )}

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={`${product.id}-${index}`}
                productName={parseProductName(product.title)}
                productDesc={product.sku}
                productPrice={formatMKD(product.price)}
                imageUrl={product.imageUrl}
                productSlug={product.id}
              />
            ))}
          </div>
        ) : query ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noResults.title')}</h3>
            <p className="text-gray-600 mb-6">
              {t('noResults.description')}
            </p>
            <Link href={`/${locale}`}>
              <Button>{t('noResults.browseButton')}</Button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('startSearch.title')}</h3>
            <p className="text-gray-600">
              {t('startSearch.description')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="h-48 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
} 