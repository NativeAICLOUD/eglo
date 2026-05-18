"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import { Lightbulb, Fan, Zap, Home, ChevronRight, X, ArrowRight } from "lucide-react"
import { useTranslations } from 'next-intl'
import { useParams, usePathname } from 'next/navigation'
import { apiService, BackendCategory } from "../lib/api"
import { categoryPromos, subcategoryOrder, type PromoCard } from "../lib/megaMenuPromos"

interface NavigationProps {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
}

export function Navigation({ isMobileMenuOpen, setIsMobileMenuOpen }: NavigationProps) {
  const [categories, setCategories] = useState<BackendCategory[]>([])
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [hoveredSubcategory, setHoveredSubcategory] = useState<string | null>(null)
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null)
  const [expandedMobileSubcategory, setExpandedMobileSubcategory] = useState<string | null>(null)
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const t = useTranslations('navigation')
  const tCat = useTranslations('categories')
  const params = useParams()
  const locale = params.locale as string
  const pathname = usePathname()

  const slugToCamel = (slug: string) =>
    slug.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())

  const tCatName = (path: string, fallback: string): string => {
    try { return tCat(path) as string } catch { return fallback }
  }

  const catName = (slug: string, fallback: string) =>
    tCatName(`${slugToCamel(slug)}.name`, fallback)

  const subName = (catSlug: string, subSlug: string, fallback: string) =>
    tCatName(`${slugToCamel(catSlug)}.subcategories.${slugToCamel(subSlug)}.name`, fallback)

  const childName = (catSlug: string, subSlug: string, childSlug: string, fallback: string) =>
    tCatName(`${slugToCamel(catSlug)}.subcategories.${slugToCamel(subSlug)}.subcategories.${slugToCamel(childSlug)}.name`, fallback)

  const sortedSubs = (catSlug: string, subs: BackendCategory[]): BackendCategory[] => {
    const order = subcategoryOrder[catSlug]
    if (!order) return subs
    return [...subs].sort((a, b) => {
      const ia = order.indexOf(a.slug)
      const ib = order.indexOf(b.slug)
      if (ia === -1 && ib === -1) return 0
      if (ia === -1) return 1
      if (ib === -1) return -1
      return ia - ib
    })
  }

  useEffect(() => {
    apiService.getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    return () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current) }
  }, [])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setHoveredCategory(null)
        setHoveredSubcategory(null)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const clearClose = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
  }

  const scheduleClose = () => {
    clearClose()
    closeTimerRef.current = setTimeout(() => {
      setHoveredCategory(null)
      setHoveredSubcategory(null)
    }, 150)
  }

  const handleCategoryEnter = (id: string) => {
    clearClose()
    setHoveredCategory(id)
    setHoveredSubcategory(null)
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Lightbulb": return <Lightbulb className="w-4 h-4" />
      case "Fan":       return <Fan className="w-4 h-4" />
      case "Zap":       return <Zap className="w-4 h-4" />
      case "Home":      return <Home className="w-4 h-4" />
      default:          return null
    }
  }

  const activeCategory   = categories.find(c => c.id === hoveredCategory) ?? null
  const activeSub        = activeCategory?.subcategories.find(s => s.id === hoveredSubcategory) ?? null
  const promos           = activeCategory ? (categoryPromos[activeCategory.slug] ?? null) : null
  const panelOpen        = !!hoveredCategory

  const promoText = (map: Record<string, string>) =>
    map[locale] ?? map['mk'] ?? Object.values(map)[0] ?? ''

  return (
    <nav
      className="border-t border-gray-100 relative"
      aria-label="Main navigation"
      onMouseLeave={scheduleClose}
    >
      {/* ── Desktop nav bar ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="hidden md:flex items-center justify-center gap-8 py-4" role="menubar">
          {categories.map((cat) => (
            <div
              key={cat.id}
              role="menuitem"
              aria-haspopup={cat.subcategories.length > 0 ? 'true' : undefined}
              aria-expanded={hoveredCategory === cat.id}
              onMouseEnter={() => handleCategoryEnter(cat.id)}
            >
              <Link
                href={`/${locale}/category/${cat.slug}`}
                className={`text-[15px] font-medium tracking-[-0.01em] transition-colors pb-0.5 border-b-2 ${
                  pathname.startsWith(`/${locale}/category/${cat.slug}`) || hoveredCategory === cat.id
                    ? 'text-teal-600 border-teal-600'
                    : 'text-gray-500 hover:text-teal-600 border-transparent hover:border-teal-600'
                }`}
              >
                {catName(cat.slug, cat.name)}
              </Link>
            </div>
          ))}

          {/* Inspiration — closes the mega-menu on hover */}
          <Link
            href={`/${locale}/inspiration`}
            className={`text-[15px] font-medium tracking-[-0.01em] transition-colors pb-0.5 border-b-2 ${
              pathname.startsWith(`/${locale}/inspiration`)
                ? 'text-teal-600 border-teal-600'
                : 'text-gray-500 hover:text-teal-600 border-transparent hover:border-teal-600'
            }`}
            onMouseEnter={() => { clearClose(); setHoveredCategory(null) }}
          >
            {t('inspiration')}
          </Link>
        </div>
      </div>

      {/* ── Mega-menu panel (full-width, sibling of nav bar) ──────────
          Always in the DOM; toggled via opacity + translateY so CSS
          transitions work without React mount/unmount jank.           */}
      <div
        className={`absolute top-full left-0 right-0 w-full bg-white border-t border-gray-100 shadow-2xl z-50
          transition-all duration-200 ease-out
          ${panelOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-1 pointer-events-none'
          }`}
        onMouseEnter={clearClose}
        role="region"
        aria-label="Category submenu"
      >
        {activeCategory && (
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="grid gap-8" style={{ gridTemplateColumns: '240px 220px 1fr' }}>

              {/* ── Column 1: subcategory list ──────────────────────── */}
              <div>
                <ul role="menu" className="space-y-0.5">
                  {sortedSubs(activeCategory.slug, activeCategory.subcategories).map((sub) => (
                    <li key={sub.id} role="none">
                      <Link
                        href={`/${locale}/subcategory/${sub.slug}`}
                        role="menuitem"
                        className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm transition-colors ${
                          hoveredSubcategory === sub.id
                            ? 'bg-teal-50 text-teal-700'
                            : 'text-gray-700 hover:bg-teal-50 hover:text-teal-700'
                        }`}
                        onMouseEnter={() => setHoveredSubcategory(sub.id)}
                      >
                        <span className="font-medium">{subName(activeCategory.slug, sub.slug, sub.name)}</span>
                        {sub.subcategories.length > 0 && (
                          <ChevronRight
                            className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                              hoveredSubcategory === sub.id
                                ? 'text-teal-500'
                                : 'text-gray-400'
                            }`}
                          />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* View all */}
                <div className="mt-2 pt-2 border-t border-gray-50">
                  <Link
                    href={`/${locale}/category/${activeCategory.slug}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    {t('all')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* ── Column 2: children panel ─────────────────────────
                  Fades in when hovering a sub that has children.
                  Fixed-width column keeps promo cards from jumping.    */}
              <div
                className={`transition-all duration-150 ${
                  activeSub && activeSub.subcategories.length > 0
                    ? 'opacity-100 pointer-events-auto'
                    : 'opacity-0 pointer-events-none'
                }`}
              >
                {activeSub && activeSub.subcategories.length > 0 && (
                  <>
                    <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      {subName(activeCategory.slug, activeSub.slug, activeSub.name)}
                    </p>
                    <ul role="menu" className="space-y-0.5">
                      {activeSub.subcategories.map((child) => (
                        <li key={child.id} role="none">
                          <Link
                            href={`/${locale}/subcategory/${child.slug}`}
                            role="menuitem"
                            className="block px-3 py-2 text-sm text-gray-600 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
                          >
                            {childName(activeCategory.slug, activeSub.slug, child.slug, child.name)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 pt-2 border-t border-gray-50">
                      <Link
                        href={`/${locale}/subcategory/${activeSub.slug}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                      >
                        {t('all')}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </>
                )}
              </div>

              {/* ── Column 3: promo cards ────────────────────────────
                  Two cards fill the column height via flex-1.
                  The grid row height is set by column 1 (subcategory
                  list), so flex-1 cards evenly split that height.     */}
              <div className="flex flex-col gap-3 h-full">
                {promos ? promos.map((promo: PromoCard, i: number) => (
                  <div
                    key={i}
                    className="relative rounded-xl overflow-hidden group flex-1 min-h-[110px]"
                  >
                    <Image
                      src={promo.image}
                      alt={promoText(promo.title)}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 1280px) 400px, 500px"
                    />
                    {/* gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

                    {/* text + CTA */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-semibold text-sm leading-tight mb-0.5">
                        {promoText(promo.title)}
                      </h3>
                      <p className="text-white/75 text-xs mb-3 line-clamp-1">
                        {promoText(promo.description)}
                      </p>
                      <Link
                        href={`/${locale}${promo.ctaSlug}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white border border-white/60 rounded-full hover:bg-white hover:text-teal-700 transition-colors"
                      >
                        {promoText(promo.ctaText)}
                      </Link>
                    </div>
                  </div>
                )) : null}
              </div>

            </div>
          </div>
        )}
      </div>

      {/* ── Mobile navigation ────────────────────────────────────────── */}
      <div className="md:hidden">
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-50">
            <div className="absolute inset-0 bg-white flex flex-col">

              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                <span className="text-lg font-semibold">{t('menu')}</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Scrollable list */}
              <div className="overflow-y-auto flex-1 pb-8">
                {categories.map((cat) => (
                  <div key={cat.id} className="border-b border-gray-100">
                    <div className="flex items-center">
                      <Link
                        href={`/${locale}/category/${cat.slug}`}
                        className="flex-1 flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {getIcon(cat.icon ?? '')}
                        <span className="font-medium">{catName(cat.slug, cat.name)}</span>
                      </Link>
                      {cat.subcategories.length > 0 && (
                        <button
                          onClick={() => setExpandedMobileCategory(
                            expandedMobileCategory === cat.id ? null : cat.id
                          )}
                          className="p-4 hover:bg-gray-50 transition-colors"
                          aria-label={`Expand ${cat.name}`}
                          aria-expanded={expandedMobileCategory === cat.id}
                        >
                          <ChevronRight
                            className={`w-5 h-5 text-teal-600 transition-transform ${
                              expandedMobileCategory === cat.id ? 'rotate-90' : ''
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {expandedMobileCategory === cat.id && cat.subcategories.length > 0 && (
                      <div className="bg-gray-50">
                        {sortedSubs(cat.slug, cat.subcategories).map((sub) => (
                          <div key={sub.id} className="border-t border-gray-100">
                            <div className="flex items-center">
                              <Link
                                href={`/${locale}/subcategory/${sub.slug}`}
                                className="flex-1 p-4 pl-12 hover:bg-gray-100 transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                <span className="text-gray-700 text-sm">{subName(cat.slug, sub.slug, sub.name)}</span>
                              </Link>
                              {sub.subcategories.length > 0 && (
                                <button
                                  onClick={() => setExpandedMobileSubcategory(
                                    expandedMobileSubcategory === sub.id ? null : sub.id
                                  )}
                                  className="p-4 hover:bg-gray-100 transition-colors"
                                  aria-label={`Expand ${sub.name}`}
                                  aria-expanded={expandedMobileSubcategory === sub.id}
                                >
                                  <ChevronRight
                                    className={`w-4 h-4 text-teal-600 transition-transform ${
                                      expandedMobileSubcategory === sub.id ? 'rotate-90' : ''
                                    }`}
                                  />
                                </button>
                              )}
                            </div>

                            {expandedMobileSubcategory === sub.id && sub.subcategories.length > 0 && (
                              <div className="bg-gray-100">
                                {sub.subcategories.map((child) => (
                                  <Link
                                    key={child.id}
                                    href={`/${locale}/subcategory/${child.slug}`}
                                    className="block p-3 pl-16 text-sm text-gray-600 hover:text-teal-600 transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                  >
                                    {childName(cat.slug, sub.slug, child.slug, child.name)}
                                  </Link>
                                ))}
                                <Link
                                  href={`/${locale}/subcategory/${sub.slug}`}
                                  className="flex items-center gap-1 p-3 pl-16 text-sm text-teal-600 font-medium hover:text-teal-700 transition-colors border-t border-gray-200"
                                  onClick={() => setIsMobileMenuOpen(false)}
                                >
                                  {t('viewAll')}
                                  <ArrowRight className="w-3 h-3" />
                                </Link>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* View all category */}
                        <Link
                          href={`/${locale}/category/${cat.slug}`}
                          className="flex items-center gap-1.5 p-4 pl-12 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors border-t border-gray-200"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {t('viewAll')}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                ))}

                {/* Inspiration */}
                <div className="border-b border-gray-100">
                  <Link
                    href={`/${locale}/inspiration`}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Lightbulb className="w-5 h-5" />
                    <span className="font-medium">{t('inspiration')}</span>
                  </Link>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
