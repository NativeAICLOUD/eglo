"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, X, SlidersHorizontal } from "lucide-react"
import { useTranslations } from 'next-intl'

interface FilterOption {
  value: string
  label: string
  swatch?: string
  count?: number
}

interface FilterConfig {
  key: string
  label: string
  type?: string
  applicableTo?: string
  options: FilterOption[]
}

interface FilterGridProps {
  filters: FilterConfig[]
  onFilterChange: (key: string, value: string) => void
  onResetFilters?: () => void
  className?: string
  showMobileButton?: boolean
  isFilterPanelOpen?: boolean
  onToggleFilterPanel?: (isOpen: boolean) => void
  selectedFilters?: Record<string, string[]>
  onSelectedFiltersChange?: (filters: Record<string, string[]>) => void
}

export function FilterGrid({
  filters,
  onFilterChange,
  onResetFilters,
  className = "",
  showMobileButton = true,
  isFilterPanelOpen,
  onToggleFilterPanel,
  selectedFilters: externalSelectedFilters,
  onSelectedFiltersChange,
}: FilterGridProps) {
  const t = useTranslations('filterGrid')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [internalFilters, setInternalFilters] = useState<Record<string, string[]>>({})
  const [internalPanelOpen, setInternalPanelOpen] = useState(false)
  const [mobileOpenSection, setMobileOpenSection] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeFilters = externalSelectedFilters ?? internalFilters
  const setActiveFilters = onSelectedFiltersChange ?? setInternalFilters
  const panelOpen = isFilterPanelOpen !== undefined ? isFilterPanelOpen : internalPanelOpen
  const setPanelOpen = onToggleFilterPanel ?? setInternalPanelOpen

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (panelOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [panelOpen])

  const getCount = (key: string) => activeFilters[key]?.length ?? 0
  const totalActive = Object.values(activeFilters).reduce((s, v) => s + v.length, 0)

  const toggle = (filterKey: string, value: string, checked: boolean) => {
    const current = activeFilters[filterKey] ?? []
    const next = checked ? [...current, value] : current.filter(v => v !== value)
    const updated = { ...activeFilters }
    if (next.length === 0) delete updated[filterKey]
    else updated[filterKey] = next
    setActiveFilters(updated)
    onFilterChange(filterKey, next.join(','))
  }

  const removeChip = (filterKey: string, value: string) => toggle(filterKey, value, false)

  const resetAll = () => {
    setActiveFilters({})
    setOpenDropdown(null)
    setMobileOpenSection(null)
    onResetFilters?.()
  }

  const renderOptionLabel = (filter: FilterConfig, option: FilterOption, checked: boolean) => (
    <span className={`flex items-center gap-2 text-sm transition-colors flex-1 ${checked ? 'text-teal-700 font-medium' : 'text-gray-700'}`}>
      {filter.type === 'color-swatch' && option.swatch && (
        <span
          className={`w-4 h-4 rounded-full flex-shrink-0 border ${checked ? 'border-teal-500 ring-1 ring-teal-400' : 'border-gray-300'}`}
          style={{ backgroundColor: option.swatch }}
        />
      )}
      <span>{option.label}</span>
      {option.count !== undefined && (
        <span className="ml-auto text-xs text-gray-400">({option.count})</span>
      )}
    </span>
  )

  const ActiveChips = () => (
    <div className="flex flex-wrap gap-2">
      {Object.entries(activeFilters).flatMap(([filterKey, values]) => {
        const filter = filters.find(f => f.key === filterKey)
        if (!filter) return []
        return values.map((value) => {
          const option = filter.options.find(o => o.value === value)
          if (!option) return null
          return (
            <div
              key={`${filterKey}-${value}`}
              className="flex items-center gap-1.5 bg-teal-50 text-teal-700 border border-teal-200 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium"
            >
              {filter.type === 'color-swatch' && option.swatch && (
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0 border border-teal-300"
                  style={{ backgroundColor: option.swatch }}
                />
              )}
              <span className="text-teal-400 font-normal">{filter.label}:</span>
              {option.label}
              <button
                onClick={() => removeChip(filterKey, value)}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-teal-200 transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          )
        }).filter(Boolean)
      })}
    </div>
  )

  return (
    <div className={`w-full ${className}`} ref={containerRef}>

      {/* ── Desktop ─────────────────────────────────────────────────── */}
      <div className="hidden md:block">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {t('filters')}
          </div>

          {filters.map((filter) => {
            const count = getCount(filter.key)
            const isOpen = openDropdown === filter.key
            return (
              <div key={filter.key} className="relative">
                <button
                  onClick={() => setOpenDropdown(isOpen ? null : filter.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all duration-150 select-none
                    ${count > 0
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400 hover:text-teal-600'
                    }`}
                >
                  {filter.label}
                  {count > 0 && (
                    <span className="bg-white text-teal-600 rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-bold leading-none">
                      {count}
                    </span>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-30 min-w-[220px] overflow-hidden">
                    <div className="py-1 max-h-72 overflow-y-auto">
                      {filter.options.map((option) => {
                        const checked = activeFilters[filter.key]?.includes(option.value) ?? false
                        return (
                          <label
                            key={option.value}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer group"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => toggle(filter.key, option.value, e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 focus:ring-offset-0 cursor-pointer flex-shrink-0"
                            />
                            {renderOptionLabel(filter, option, checked)}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {totalActive > 0 && (
            <button
              onClick={resetAll}
              className="ml-1 text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 shrink-0"
            >
              <X className="w-3 h-3" />
              {t('resetAllFilters')}
            </button>
          )}
        </div>

        {totalActive > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
            <ActiveChips />
          </div>
        )}
      </div>

      {/* ── Mobile ──────────────────────────────────────────────────── */}
      <div className="md:hidden">
        {showMobileButton && (
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg text-left"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <SlidersHorizontal className="w-4 h-4 text-teal-600" />
              {t('filters')}
              {totalActive > 0 && (
                <span className="bg-teal-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalActive}
                </span>
              )}
            </span>
            <ChevronDown className={`w-4 h-4 text-teal-600 transition-transform ${panelOpen ? 'rotate-180' : ''}`} />
          </button>
        )}

        {/* Backdrop */}
        {panelOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setPanelOpen(false)}
          />
        )}

        {/* Slide-out drawer */}
        <div
          className={`fixed inset-y-0 right-0 w-[85vw] max-w-sm bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
            panelOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 flex-shrink-0">
            <span className="flex items-center gap-2 font-semibold text-gray-800">
              <SlidersHorizontal className="w-4 h-4 text-teal-600" />
              {t('filters')}
              {totalActive > 0 && (
                <span className="bg-teal-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalActive}
                </span>
              )}
            </span>
            <button
              onClick={() => setPanelOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close filters"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Active chips */}
          {totalActive > 0 && (
            <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <ActiveChips />
            </div>
          )}

          {/* Scrollable accordion filters */}
          <div className="flex-1 overflow-y-auto">
            {filters.map((filter, i) => {
              const count = getCount(filter.key)
              const expanded = mobileOpenSection === filter.key
              return (
                <div key={filter.key} className={i > 0 ? 'border-t border-gray-100' : ''}>
                  <button
                    onClick={() => setMobileOpenSection(expanded ? null : filter.key)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
                      {filter.label}
                      {count > 0 && (
                        <span className="bg-teal-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                          {count}
                        </span>
                      )}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </button>

                  {expanded && (
                    <div className="px-4 pb-3 bg-gray-50">
                      {filter.type === 'color-swatch' ? (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          {filter.options.map((option) => {
                            const checked = activeFilters[filter.key]?.includes(option.value) ?? false
                            return (
                              <label key={option.value} className="flex items-center gap-2.5 py-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => toggle(filter.key, option.value, e.target.checked)}
                                  className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 focus:ring-offset-0 cursor-pointer flex-shrink-0"
                                />
                                <span
                                  className={`w-4 h-4 rounded-full flex-shrink-0 border ${checked ? 'border-teal-500' : 'border-gray-300'}`}
                                  style={{ backgroundColor: option.swatch }}
                                />
                                <span className={`text-sm ${checked ? 'text-teal-700 font-medium' : 'text-gray-600'}`}>
                                  {option.label}
                                  {option.count !== undefined && <span className="text-gray-400 ml-1">({option.count})</span>}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          {filter.options.map((option) => {
                            const checked = activeFilters[filter.key]?.includes(option.value) ?? false
                            return (
                              <label key={option.value} className="flex items-center gap-2.5 py-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => toggle(filter.key, option.value, e.target.checked)}
                                  className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 focus:ring-offset-0 cursor-pointer flex-shrink-0"
                                />
                                <span className={`text-sm ${checked ? 'text-teal-700 font-medium' : 'text-gray-600'}`}>
                                  {option.label}
                                  {option.count !== undefined && <span className="text-gray-400 ml-1">({option.count})</span>}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Drawer footer */}
          <div className="px-4 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
            {totalActive > 0 && (
              <button
                onClick={resetAll}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium"
              >
                {t('resetAllFilters')}
              </button>
            )}
            <button
              onClick={() => setPanelOpen(false)}
              className={`py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors ${totalActive > 0 ? 'flex-1' : 'w-full'}`}
            >
              {t('apply')}
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
