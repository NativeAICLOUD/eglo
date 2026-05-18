"use client"

import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronRight, ChevronLeft, Download, Plus, Minus, ChevronDown, X, ZoomIn } from "lucide-react"
import { useState, use, useEffect, useCallback } from "react"
import { Button } from "../../../../components/Button"
import { Input } from "../../../../components/Input"
import { CartPopup } from "../../../../components/CartPopup"
import { useCart } from "../../context/CartContext"
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { apiService, BackendProduct, parseProductName, formatMKD } from "../../../../lib/api"
import productImagesMap from "../../../../data/productImages.json"
import productSpecsData from "../../../../data/productSpecs.json"

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

const PLACEHOLDER = "/placeholder.svg"

function parseJson(raw: string | null | undefined): Record<string, unknown> | null {
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export default function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = use(params) as { slug: string }
  const params_ = useParams()
  const locale = params_.locale as string
  const t = useTranslations('productPage')
  const tSpecLabels = useTranslations('productSpecs.labels')

  const [product, setProduct] = useState<BackendProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [showCartPopup, setShowCartPopup] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    product_details: true,
    dimensions: false,
    technical_information: false,
    other_information: false,
  })

  const { addToCart } = useCart()

  const openLightbox = useCallback((idx: number) => {
    setLightboxIndex(idx)
    setLightboxOpen(true)
  }, [])

  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false)
      if (e.key === "ArrowRight") setLightboxIndex(i => Math.min(i + 1, images.length - 1))
      if (e.key === "ArrowLeft") setLightboxIndex(i => Math.max(i - 1, 0))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function load() {
      const id = resolvedParams.slug

      // 1. Try the direct single-product endpoint
      try {
        const p = await apiService.getProduct(id)
        if (!cancelled) { setProduct(p); return }
      } catch (err) {
        console.warn('[ProductPage] direct fetch failed, falling back to list search:', err)
      }

      // 2. Client-side fallback: paginate through all products and find by ID.
      //    This uses the same browser → rewrite → backend path that works on all other pages.
      try {
        const first = await apiService.getProducts({ page: 1, pageSize: 100 })
        if (cancelled) return

        const found = first.items.find(p => p.id === id)
        if (found) { if (!cancelled) setProduct(found); return }

        const totalPages = Math.ceil(first.totalCount / 100)
        for (let page = 2; page <= Math.min(totalPages, 30); page++) {
          if (cancelled) return
          const data = await apiService.getProducts({ page, pageSize: 100 })
          const match = data.items.find(i => i.id === id)
          if (match) { if (!cancelled) setProduct(match); return }
        }
      } catch (err) {
        console.error('[ProductPage] list fallback failed:', err)
      }

      if (!cancelled) setProduct(null)
    }

    load().finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [resolvedParams.slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-white animate-pulse">
        {/* Breadcrumb skeleton */}
        <div className="border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center gap-2">
            <div className="h-3 w-12 bg-gray-200 rounded-full" />
            <div className="h-3 w-3 bg-gray-200 rounded-full" />
            <div className="h-3 w-24 bg-gray-200 rounded-full" />
            <div className="h-3 w-3 bg-gray-200 rounded-full" />
            <div className="h-3 w-32 bg-gray-200 rounded-full" />
          </div>
        </div>
        {/* Main content skeleton */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
            {/* Image column */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-200 rounded-lg w-full" />
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded-lg" />
                ))}
              </div>
            </div>
            {/* Info column */}
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded-full w-3/4" />
                <div className="h-4 bg-gray-200 rounded-full w-1/3" />
                <div className="h-10 bg-gray-200 rounded-full w-1/2 mt-4" />
              </div>
              <div className="bg-gray-100 rounded-lg p-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-3 bg-gray-200 rounded-full w-1/3" />
                    <div className="h-3 bg-gray-200 rounded-full w-1/4" />
                  </div>
                ))}
              </div>
              <div className="h-4 bg-gray-200 rounded-full w-1/4" />
              <div className="flex gap-4">
                <div className="h-12 bg-gray-200 rounded-lg w-32" />
                <div className="h-12 bg-gray-200 rounded-lg flex-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    notFound()
  }

  const displayName = parseProductName(product.title ?? product.name ?? "")
  const productCode = product.description ?? product.sku ?? ""
  const r2Images = (productImagesMap as Record<string, string[]>)[productCode] ?? []
  const apiImages = (product.images ?? []).map(img =>
    typeof img === "string" ? img : (img as { url: string }).url
  ).filter(Boolean)
  const images: string[] = r2Images.length > 0 ? r2Images : apiImages
  const productImageForCart = images[0] ?? product.imageUrl ?? PLACEHOLDER

  const sku = productCode

  const staticSpecs = (productSpecsData as Record<string, { productDetails?: Record<string, unknown> }>)[productCode]
  const resolveSpecValues = (data: Record<string, unknown>): Record<string, unknown> =>
    Object.fromEntries(
      Object.entries(data).map(([k, v]) => {
        if (v && typeof v === "object" && !Array.isArray(v)) {
          const loc = v as Record<string, string>
          return [k, loc[locale] ?? loc["mk"] ?? Object.values(loc)[0] ?? ""]
        }
        return [k, v]
      })
    )

  const productDetails = parseJson(product.productDetailsJson) ??
    (staticSpecs?.productDetails ? resolveSpecValues(staticSpecs.productDetails) : null)
  const dimensions      = parseJson(product.dimensionsJson)
  const technicalInfo   = parseJson(product.technicalInfoJson)
  const otherInfo       = parseJson(product.otherInfoJson)

  const toSpecKey = (label: string): string => {
    const normalized = label.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    return normalized.split(' ').map((word, i) =>
      i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    ).join('')
  }

  const translateSpecLabel = (label: string): string => {
    try { return tSpecLabels(label) } catch {}
    try { return tSpecLabels(toSpecKey(label)) } catch {}
    return label
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const renderSpecSection = (
    title: string,
    data: Record<string, unknown> | null,
    sectionKey: keyof typeof expandedSections
  ) => {
    if (!data) return null
    const entries = Object.entries(data).filter(([, v]) => v !== undefined && v !== null && v !== "")
    if (entries.length === 0) return null
    return (
      <div className="border-b border-gray-200 last:border-b-0">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 transition-colors"
        >
          <span className="font-medium text-gray-900">{title}</span>
          <div className={`transition-transform duration-200 ${expandedSections[sectionKey] ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-5 h-5 text-teal-600" />
          </div>
        </button>
        <div className={`overflow-hidden transition-all duration-200 ease-in-out ${
          expandedSections[sectionKey] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="pb-4 space-y-2">
            {entries.map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-600">{translateSpecLabel(key)}:</span>
                <span className="text-gray-900 font-medium">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        name: displayName,
        price: formatMKD(product.price),
        image: productImageForCart,
      })
    }
    setShowCartPopup(true)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <Link href={`/${locale}`} className="hover:text-teal-600 transition-colors">
              {t('breadcrumb.home')}
            </Link>
            <ChevronRight className="w-4 h-4" />
            {product.categoryId && (
              <>
                <Link href={`/${locale}/category/${product.categoryId}`} className="hover:text-teal-600 transition-colors">
                  {product.category ?? t('breadcrumb.products')}
                </Link>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
            <span className="text-gray-900">{displayName}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div
              className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group cursor-zoom-in"
              onClick={() => images.length > 0 && openLightbox(selectedImage)}
            >
              {images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={images[selectedImage]}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER }}
                />
              ) : product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                  <span className="text-6xl">💡</span>
                  <span className="text-sm">{t('noImage')}</span>
                </div>
              )}
              {images.length > 0 && (
                <div className="absolute top-3 right-3 bg-white/80 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="w-4 h-4 text-gray-700" />
                </div>
              )}
              {selectedImage > 0 && (
                <button
                  onClick={() => setSelectedImage(selectedImage - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 hover:text-teal-600 rounded-full p-2 shadow-lg transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              {selectedImage < images.length - 1 && (
                <button
                  onClick={() => setSelectedImage(selectedImage + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 hover:text-teal-600 rounded-full p-2 shadow-lg transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === idx ? 'border-teal-600' : 'border-transparent'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`${displayName} ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {displayName}
              </h1>
              {sku && (
                <p className="text-sm text-gray-500 font-mono mb-4">{t('articleNumber')}: {sku}</p>
              )}
              <p className="text-3xl md:text-4xl font-bold text-gray-900">
                {formatMKD(product.price ?? 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{t('vatNotice')}</p>
              <p className="text-xs text-teal-600 font-medium mt-0.5">{t('deliveryNotice')}</p>
            </div>

            {productDetails && (
              <div className="bg-gray-50 rounded-lg p-5 space-y-2">
                {Object.entries(productDetails)
                  .filter(([, v]) => v !== undefined && v !== null && v !== "")
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600">{translateSpecLabel(key)}:</span>
                      <span className="text-gray-900 font-medium">{String(value)}</span>
                    </div>
                  ))}
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <Link
                href="#"
                className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium transition-colors text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                {t('downloadManual')}
              </Link>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="p-2 hover:bg-gray-100 transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-16 text-center border-0 focus:ring-0"
                    min="1"
                  />
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="p-2 hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <Button variant="primary" className="flex-1 py-3 px-6" onClick={handleAddToCart}>
                  {t('addToCart')}
                </Button>
              </div>
              <Link
                href="#"
                className="inline-block text-teal-600 hover:text-teal-700 font-medium transition-colors text-sm"
              >
                {t('warrantyConditions')}
              </Link>
            </div>
          </div>
        </div>

        {/* Spec sections */}
        <div className="mt-12">
          <div className="lg:max-w-[calc(50%-1rem)] bg-gray-50 rounded-lg overflow-hidden p-4">
            {renderSpecSection(t('dimensions'), dimensions, "dimensions")}
            {renderSpecSection(t('technicalInformation'), technicalInfo, "technical_information")}
            {renderSpecSection(t('otherInformation'), otherInfo, "other_information")}
          </div>
        </div>
      </div>

      <CartPopup
        productName={displayName}
        isVisible={showCartPopup}
        onClose={() => setShowCartPopup(false)}
      />

      {/* Lightbox */}
      {lightboxOpen && images.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Prev */}
          {lightboxIndex > 0 && (
            <button
              className="absolute left-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i - 1) }}
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
          )}

          {/* Image */}
          <div className="max-w-5xl max-h-[90vh] mx-16 flex items-center justify-center" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[lightboxIndex]}
              alt={`${displayName} ${lightboxIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER }}
            />
          </div>

          {/* Next */}
          {lightboxIndex < images.length - 1 && (
            <button
              className="absolute right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i + 1) }}
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          )}

          {/* Dots */}
          {images.length > 1 && (
            <div className="absolute bottom-6 flex gap-2">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx) }}
                  className={`w-2 h-2 rounded-full transition-colors ${idx === lightboxIndex ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
