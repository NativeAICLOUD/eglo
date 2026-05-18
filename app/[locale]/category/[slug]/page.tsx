"use client"

import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight, ChevronDown } from "lucide-react"
import { useState, use, useEffect } from "react"
import { useParams } from "next/navigation"
import { useTranslations } from 'next-intl'
import categoryFiltersData from "../../../../data/categoryFilters.json"
import ProductCard from "../../../../components/ProductCard"
import { FilterGrid } from "../../../../components/FilterGrid"
import { Pagination } from "../../../../components/Pagination"
import { apiService, BackendCategory, BackendProduct, parseProductName, formatMKD } from "../../../../lib/api"
import { PageSpinner, Spinner } from "../../../../components/Spinner"

interface CategoryPageProps {
  params: Promise<{
    slug: string
  }>
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = use(params) as { slug: string }
  const params_ = useParams()
  const locale = params_.locale as string
  const t = useTranslations('categoryPage')

  const [category, setCategory] = useState<BackendCategory | null>(null)
  const [loadingCategory, setLoadingCategory] = useState(true)
  const [expandedSubcategory, setExpandedSubcategory] = useState<string | null>(null)
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
  const [products, setProducts] = useState<BackendProduct[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(24)

  useEffect(() => {
    setCurrentPage(1)
    setPageSize(24)
  }, [resolvedParams.slug])

  useEffect(() => {
    setLoadingCategory(true)
    apiService.getCategories()
      .then(cats => setCategory(cats.find(c => c.slug === resolvedParams.slug) ?? null))
      .catch(() => setCategory(null))
      .finally(() => setLoadingCategory(false))
  }, [resolvedParams.slug])

  useEffect(() => {
    setLoadingProducts(true)
    const priceRange = activeFilters.price?.[0]
    let minPrice: number | undefined
    let maxPrice: number | undefined
    if (priceRange) {
      if (priceRange.endsWith('+')) {
        minPrice = Number(priceRange.slice(0, -1))
      } else {
        const [lo, hi] = priceRange.split('-').map(Number)
        minPrice = lo
        maxPrice = hi
      }
    }
    apiService.getProducts({ categorySlug: resolvedParams.slug, pageSize, page: currentPage, minPrice, maxPrice })
      .then(data => { setProducts(data.items); setTotalCount(data.totalCount) })
      .catch(() => { setProducts([]); setTotalCount(0) })
      .finally(() => setLoadingProducts(false))
  }, [resolvedParams.slug, currentPage, pageSize, activeFilters])

  if (loadingCategory) return <PageSpinner />

  if (!category) {
    notFound()
  }

  const categoryFilters = categoryFiltersData.filters

  const handleFilterChange = (key: string, value: string) => {
    if (value) {
      setActiveFilters(prev => ({ ...prev, [key]: value.split(',') }))
    } else {
      setActiveFilters(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const handleResetFilters = () => setActiveFilters({})

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3 md:py-4">
          <nav className="flex items-center flex-wrap gap-1 md:gap-2 text-xs md:text-sm text-gray-500">
            <Link href={`/${locale}`} className="hover:text-teal-600 transition-colors">
              {t('breadcrumb.home')}
            </Link>
            <ChevronRight className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span className="text-gray-900">{category.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-1 md:px-2 lg:px-2 py-4 md:py-12">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 md:mb-6">{category.name}</h1>

          <div className="grid lg:grid-cols-4 gap-4 md:gap-6">
            {/* Text Description */}
            <div className="lg:col-span-1 space-y-3 md:space-y-3">
              <div className="space-y-2 md:space-y-3 text-gray-600 leading-relaxed text-sm md:text-base">
                {(category.description ?? '').split('\n\n').map((paragraph: string, index: number) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
              <Link
                href="#"
                className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium transition-colors text-sm md:text-base"
              >
                {t('readMore')}
                <ChevronRight className="ml-1 w-4 h-4" />
              </Link>
            </div>

            {/* Images */}
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 bg-gray-100 rounded-lg md:rounded-2xl overflow-hidden">
                <Image
                  src={category.imageUrl ?? "/assets/images/interior-lights1.jpg"}
                  alt={`${category.name} example 1`}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 bg-gray-100 rounded-lg md:rounded-2xl overflow-hidden">
                <Image
                  src={category.imageUrl ?? "/assets/images/interior-lights2.jpg"}
                  alt={`${category.name} example 2`}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Product Section with Filters */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* Subcategories Sidebar - Desktop */}
          <div className="hidden lg:block lg:w-80 bg-gray-50 rounded-lg p-3 md:p-4 order-2 lg:order-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 md:mb-4">{t('categories')}</h3>
            <div className="space-y-1 md:space-y-2">
              {category.subcategories.map((subcategory: BackendCategory) => (
                <div key={subcategory.slug}>
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      {subcategory.subcategories.length > 0 ? (
                        <button
                          onClick={() => setExpandedSubcategory(
                            expandedSubcategory === subcategory.slug ? null : subcategory.slug
                          )}
                          className="flex-1 py-2 px-3 text-gray-700 hover:text-teal-600 hover:bg-gray-100 rounded transition-colors text-sm md:text-base text-left"
                        >
                          {subcategory.name}
                        </button>
                      ) : (
                        <Link
                          href={`/${locale}/subcategory/${subcategory.slug}`}
                          className="flex-1 py-2 px-3 text-gray-700 hover:text-teal-600 hover:bg-gray-100 rounded transition-colors text-sm md:text-base text-left"
                          style={{ textDecoration: 'none' }}
                        >
                          {subcategory.name}
                        </Link>
                      )}
                      {subcategory.subcategories.length > 0 && (
                        <button
                          onClick={() => setExpandedSubcategory(
                            expandedSubcategory === subcategory.slug ? null : subcategory.slug
                          )}
                          className="ml-1 p-1 rounded hover:bg-gray-100"
                          aria-label={expandedSubcategory === subcategory.slug ? t('collapse') : t('expand')}
                        >
                          {expandedSubcategory === subcategory.slug ? (
                            <ChevronDown className="w-4 h-4 text-teal-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-teal-600" />
                          )}
                        </button>
                      )}
                    </div>
                    {expandedSubcategory === subcategory.slug && subcategory.subcategories.length > 0 && (
                      <div className="ml-4 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                        {subcategory.subcategories.map((subSub: BackendCategory) => (
                          <Link
                            key={subSub.slug}
                            href={`/${locale}/subcategory/${subSub.slug}`}
                            className="block py-1 px-3 text-sm text-gray-600 hover:text-teal-600 hover:bg-gray-100 rounded transition-colors"
                          >
                            {subSub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Filters and Products */}
          <div className="flex-1 order-1 lg:order-2">
            {/* Mobile Categories and Filters Buttons */}
            <div className="lg:hidden mb-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setIsCategoriesOpen(!isCategoriesOpen)
                    if (!isCategoriesOpen) setIsFilterPanelOpen(false)
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors text-left"
                >
                  <span className="text-sm font-medium text-gray-700">{t('categories')}</span>
                  <ChevronDown className={`w-4 h-4 text-teal-600 transition-transform ${isCategoriesOpen ? 'rotate-180' : ''}`} />
                </button>

                <button
                  onClick={() => {
                    setIsFilterPanelOpen(!isFilterPanelOpen)
                    if (!isFilterPanelOpen) setIsCategoriesOpen(false)
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors text-left"
                >
                  <span className="text-sm font-medium text-gray-700">{t('filters')}</span>
                  <ChevronDown className={`w-4 h-4 text-teal-600 transition-transform ${isFilterPanelOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Mobile Categories Dropdown */}
            {isCategoriesOpen && (
              <div className="lg:hidden mb-4">
                <div className="rounded-lg p-4" style={{ backgroundColor: '#e7f5f5' }}>
                  {category.subcategories.map((subcategory: BackendCategory, index: number) => (
                    <div key={subcategory.slug}>
                      <button
                        onClick={() => setExpandedSubcategory(
                          expandedSubcategory === subcategory.slug ? null : subcategory.slug
                        )}
                        className="w-full flex items-center justify-between py-3 text-left hover:bg-white/50 transition-colors rounded"
                      >
                        <span className="text-sm font-medium text-gray-700">{subcategory.name}</span>
                        {subcategory.subcategories.length > 0 && (
                          expandedSubcategory === subcategory.slug ? (
                            <ChevronDown className="w-4 h-4 text-teal-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-teal-600" />
                          )
                        )}
                      </button>
                      {expandedSubcategory === subcategory.slug && subcategory.subcategories.length > 0 && (
                        <div className="ml-4 mt-1 space-y-1">
                          {subcategory.subcategories.map((subSub: BackendCategory) => (
                            <Link
                              key={subSub.slug}
                              href={`/${locale}/subcategory/${subSub.slug}`}
                              className="block py-2 px-3 text-sm text-gray-600 hover:bg-white/50 rounded transition-colors"
                            >
                              {subSub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                      {index < category.subcategories.length - 1 && (
                        <div className="border-t border-white my-2" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters Section */}
            <div className="mb-6 md:mb-8">
              <div className="hidden md:block bg-white border border-gray-200 rounded-lg p-4 md:p-6">
                <FilterGrid
                  filters={categoryFilters}
                  onFilterChange={handleFilterChange}
                  onResetFilters={handleResetFilters}
                  selectedFilters={activeFilters}
                  onSelectedFiltersChange={setActiveFilters}
                />
              </div>
              <div className="md:hidden">
                <FilterGrid
                  filters={categoryFilters}
                  onFilterChange={handleFilterChange}
                  onResetFilters={handleResetFilters}
                  showMobileButton={false}
                  isFilterPanelOpen={isFilterPanelOpen}
                  onToggleFilterPanel={setIsFilterPanelOpen}
                  selectedFilters={activeFilters}
                  onSelectedFiltersChange={setActiveFilters}
                />
              </div>
            </div>

            {/* Product Grid */}
            {loadingProducts ? (
              <div className="flex justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : totalCount === 0 ? (
              <div className="text-center py-16 text-gray-400">{t('noProducts')}</div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 md:gap-4">
                  {products.map((product, index) => (
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
                <Pagination
                  currentPage={currentPage}
                  totalCount={totalCount}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={size => { setPageSize(size); setCurrentPage(1) }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
