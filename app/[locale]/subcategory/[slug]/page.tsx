"use client"

import Image from "next/image"
import Link from "next/link"
import { ChevronRight, ChevronDown } from "lucide-react"
import { useState, use, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTranslations } from 'next-intl'
import categoryFiltersData from "../../../../data/categoryFilters.json"
import ProductCard from "../../../../components/ProductCard"
import { FilterGrid } from "../../../../components/FilterGrid"
import { Pagination } from "../../../../components/Pagination"
import { apiService, BackendCategory, BackendProduct, parseProductName, formatMKD } from "../../../../lib/api"
import { PageSpinner } from "../../../../components/Spinner"

interface SubcategoryPageProps {
  params: Promise<{
    slug: string
  }>
}

const ILLUMINANT_SLUGS = new Set([
  'e27', 'e14', 'g4', 'g9', 'gu53', 'gu10', 'r7s', 'gx53', 'gu5-3',
  'led-bulbs', 'halogen-bulbs', 'filament-bulbs'
])

function findBySlug(categories: BackendCategory[], slug: string): BackendCategory | null {
  for (const cat of categories) {
    if (cat.slug === slug) return cat
    const found = findBySlug(cat.subcategories, slug)
    if (found) return found
  }
  return null
}

function findParent(
  categories: BackendCategory[],
  slug: string,
  parent: BackendCategory | null = null
): BackendCategory | null | undefined {
  for (const cat of categories) {
    if (cat.slug === slug) return parent
    const found = findParent(cat.subcategories, slug, cat)
    if (found !== undefined) return found
  }
  return undefined
}

function findTopLevel(categories: BackendCategory[], slug: string): BackendCategory | null {
  for (const cat of categories) {
    if (cat.slug === slug) return cat
    if (findBySlug(cat.subcategories, slug)) return cat
  }
  return null
}

export default function SubcategoryPage({ params }: SubcategoryPageProps) {
  const resolvedParams = use(params) as { slug: string }
  const params_ = useParams()
  const locale = params_.locale as string
  const t = useTranslations('subcategoryPage')
  const router = useRouter()

  const [allCategories, setAllCategories] = useState<BackendCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [expandedSubcategory, setExpandedSubcategory] = useState<string | null>(null)
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
  const [products, setProducts] = useState<BackendProduct[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(24)
  const filtersInitialized = useRef(false)

  // Initialize filters from URL on mount
  useEffect(() => {
    if (filtersInitialized.current) return
    filtersInitialized.current = true
    const params = new URLSearchParams(window.location.search)
    const initial: Record<string, string[]> = {}
    params.forEach((value, key) => {
      if (value) initial[key] = value.split(',')
    })
    if (Object.keys(initial).length > 0) setActiveFilters(initial)
  }, [])

  // Sync filters to URL
  const isFirstFilterSync = useRef(true)
  useEffect(() => {
    if (!filtersInitialized.current) return
    if (isFirstFilterSync.current) {
      isFirstFilterSync.current = false
      return
    }
    const params = new URLSearchParams()
    Object.entries(activeFilters).forEach(([key, values]) => {
      if (values.length > 0) params.set(key, values.join(','))
    })
    const search = params.toString()
    router.replace(search ? `?${search}` : window.location.pathname, { scroll: false })
  }, [activeFilters, router])

  useEffect(() => {
    apiService.getCategories()
      .then(setAllCategories)
      .catch(() => setAllCategories([]))
      .finally(() => setLoadingCategories(false))
  }, [])

  useEffect(() => {
    let cancelled = false
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
    apiService.getProducts({ categorySlug: resolvedParams.slug, page: currentPage, pageSize, minPrice, maxPrice })
      .then(result => {
        if (!cancelled) { setProducts(result.items); setTotalCount(result.totalCount) }
      })
      .catch(() => {
        if (!cancelled) { setProducts([]); setTotalCount(0) }
      })
      .finally(() => { if (!cancelled) setLoadingProducts(false) })
    return () => { cancelled = true }
  }, [resolvedParams.slug, currentPage, pageSize, activeFilters])

  const subcategory = findBySlug(allCategories, resolvedParams.slug)
  const parentCategory = findParent(allCategories, resolvedParams.slug) ?? null
  const topLevelCategory = findTopLevel(allCategories, resolvedParams.slug)

  if (loadingCategories) return <PageSpinner />

  if (!subcategory) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center py-16 text-gray-400 text-lg">{t('noProducts')}</div>
      </div>
    )
  }

  const isIlluminant =
    ILLUMINANT_SLUGS.has(resolvedParams.slug) ||
    topLevelCategory?.slug === 'illuminants'

  // Filter by applicableTo — fixtures-only filters hidden for illuminant pages and vice versa
  const visibleFilters = categoryFiltersData.filters.filter(f => {
    const a = (f as { applicableTo?: string }).applicableTo
    if (!a || a === 'all') return true
    if (isIlluminant) return a === 'illuminants'
    return a === 'fixtures' || a === 'all'
  })

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
            {parentCategory && (
              <>
                <Link href={`/${locale}/category/${parentCategory.slug}`} className="hover:text-teal-600 transition-colors">
                  {parentCategory.name}
                </Link>
                <ChevronRight className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              </>
            )}
            <span className="text-gray-900">{subcategory.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-1 md:px-2 lg:px-2 py-4 md:py-12">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 md:mb-3">
            {subcategory.name}
          </h1>

          {topLevelCategory?.slug !== 'illuminants' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start">
              <div className="space-y-2 md:space-y-3 text-gray-600 leading-relaxed text-sm md:text-base">
                {(subcategory.description ?? '').split('\n\n').map((paragraph: string, index: number) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
              <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 bg-gray-100 rounded-lg md:rounded-2xl overflow-hidden flex items-center justify-center">
                <Image
                  src={subcategory.imageUrl ?? "/assets/images/interior-lights1.jpg"}
                  alt={`${subcategory.name} example`}
                  fill
                  className="object-cover rounded-2xl"
                  priority
                />
              </div>
            </div>
          )}
        </div>

        {/* Product Section with Filters */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* Subcategories Sidebar - Desktop */}
          <div className="hidden lg:block lg:w-80 bg-gray-50 rounded-lg p-3 md:p-4 order-2 lg:order-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 md:mb-4">{t('categories')}</h3>
            <div className="space-y-1 md:space-y-2">
              {topLevelCategory?.subcategories.map((sibling: BackendCategory) => (
                <div key={sibling.slug} className="flex flex-col">
                  <div className="flex items-center">
                    <Link
                      href={`/${locale}/subcategory/${sibling.slug}`}
                      className={`flex-1 py-2 px-3 text-gray-700 hover:text-teal-600 hover:bg-gray-100 rounded transition-colors text-sm md:text-base text-left${sibling.slug === resolvedParams.slug ? ' font-semibold' : ''}`}
                      style={{ textDecoration: 'none' }}
                    >
                      {sibling.name}
                    </Link>
                    {sibling.subcategories.length > 0 && (
                      <button
                        onClick={() => setExpandedSubcategory(
                          expandedSubcategory === sibling.slug ? null : sibling.slug
                        )}
                        className="ml-1 p-1 rounded hover:bg-gray-100"
                        aria-label={expandedSubcategory === sibling.slug ? t('collapse') : t('expand')}
                      >
                        {expandedSubcategory === sibling.slug ? (
                          <ChevronDown className="w-4 h-4 text-teal-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-teal-600" />
                        )}
                      </button>
                    )}
                  </div>
                  {expandedSubcategory === sibling.slug && sibling.subcategories.length > 0 && (
                    <div className="ml-4 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                      {sibling.subcategories.map((subSub: BackendCategory) => (
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
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    {t('filters')}
                    {Object.values(activeFilters).reduce((s, v) => s + v.length, 0) > 0 && (
                      <span className="bg-teal-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {Object.values(activeFilters).reduce((s, v) => s + v.length, 0)}
                      </span>
                    )}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-teal-600 transition-transform ${isFilterPanelOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Mobile Categories Dropdown */}
            {isCategoriesOpen && (
              <div className="lg:hidden mb-4">
                <div className="rounded-lg p-4" style={{ backgroundColor: '#e7f5f5' }}>
                  {topLevelCategory?.subcategories.map((sibling: BackendCategory) => (
                    <div key={sibling.slug}>
                      <Link
                        href={`/${locale}/subcategory/${sibling.slug}`}
                        className={`block py-3 text-sm font-medium text-gray-700 hover:bg-white/50 transition-colors rounded${sibling.slug === resolvedParams.slug ? ' font-semibold' : ''}`}
                      >
                        {sibling.name}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters Section */}
            <div className="mb-6 md:mb-8">
              <div className="hidden md:block bg-white border border-gray-200 rounded-lg p-4 md:p-6">
                <FilterGrid
                  filters={visibleFilters}
                  onFilterChange={handleFilterChange}
                  onResetFilters={handleResetFilters}
                  selectedFilters={activeFilters}
                  onSelectedFiltersChange={setActiveFilters}
                />
              </div>
              <div className="md:hidden">
                <FilterGrid
                  filters={visibleFilters}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 md:gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm animate-pulse">
                    <div className="bg-gray-200 aspect-square w-full" />
                    <div className="p-4 space-y-3">
                      <div className="h-3 bg-gray-200 rounded-full w-3/4" />
                      <div className="h-3 bg-gray-200 rounded-full w-1/2" />
                      <div className="h-4 bg-gray-200 rounded-full w-1/3 mt-2" />
                    </div>
                  </div>
                ))}
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
