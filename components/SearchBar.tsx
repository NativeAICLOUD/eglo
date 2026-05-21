"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { Search, X, Loader2, ArrowRight } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import Image from "next/image"
import Link from "next/link"
import { apiService, BackendProduct, parseProductName, formatMKD } from "../lib/api"

interface SearchBarProps {
  mobile?: boolean
}

export function SearchBar({ mobile = false }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<BackendProduct[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isFocused, setIsFocused] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations("header")

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const fetchResults = useCallback((q: string) => {
    setLoading(true)
    apiService
      .getProducts({ search: q.trim(), pageSize: 6 })
      .then(data => {
        setResults(data.items)
        setIsOpen(true)
        setLoading(false)
      })
      .catch(() => {
        setResults([])
        setLoading(false)
      })
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    setActiveIndex(-1)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (val.trim()) {
      setLoading(true)
      debounceRef.current = setTimeout(() => fetchResults(val), 280)
    } else {
      setLoading(false)
      setResults([])
      setIsOpen(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeIndex >= 0 && results[activeIndex]) {
      navigateToProduct(results[activeIndex])
      return
    }
    if (query.trim()) {
      router.push(`/${locale}/search?q=${encodeURIComponent(query.trim())}`)
      setIsOpen(false)
    }
  }

  const navigateToProduct = (product: BackendProduct) => {
    router.push(`/${locale}/product/${product.id}`)
    setIsOpen(false)
    setQuery("")
    setResults([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, -1))
    } else if (e.key === "Escape") {
      setIsOpen(false)
      setActiveIndex(-1)
      inputRef.current?.blur()
    }
  }

  const handleClear = () => {
    setQuery("")
    setResults([])
    setIsOpen(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  const showDropdown = isOpen && (loading || results.length > 0)

  return (
    <div ref={containerRef} className={`relative ${mobile ? "w-full" : "hidden sm:block flex-1 max-w-lg mx-8"}`}>
      <form onSubmit={handleSubmit} role="search" noValidate>
        <div
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all duration-200 bg-gray-50 ${
            isFocused
              ? "border-teal-400 ring-4 ring-teal-100 bg-white shadow-sm"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 text-teal-500 flex-shrink-0 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          )}

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true)
              if (query.trim() && results.length > 0) setIsOpen(true)
            }}
            onBlur={() => setIsFocused(false)}
            placeholder={t("search.placeholder")}
            autoComplete="off"
            spellCheck={false}
            className="flex-1 bg-transparent text-sm font-normal text-[#1a2332] placeholder-slate-400 outline-none min-w-0"
            aria-label={t("search.placeholder")}
            aria-autocomplete="list"
            aria-expanded={showDropdown}
          />

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors rounded-full"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          {/* Product results */}
          {results.length > 0 && (
            <ul role="listbox" className="divide-y divide-gray-50">
              {results.map((product, i) => {
                const name = parseProductName(product.title)
                const isActive = activeIndex === i
                return (
                  <li key={product.id} role="option" aria-selected={isActive}>
                    <button
                      type="button"
                      onClick={() => navigateToProduct(product)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        isActive ? "bg-teal-50" : "hover:bg-gray-50"
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-11 h-11 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={name}
                            width={44}
                            height={44}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <Search className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{t("search.skuLabel")} {product.sku}</p>
                      </div>

                      {/* Price */}
                      <span className="text-sm font-semibold text-teal-600 flex-shrink-0 ml-2">
                        {formatMKD(product.price)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Footer — view all results */}
          {query.trim() && (
            <div className={results.length > 0 ? "border-t border-gray-100" : ""}>
              <Link
                href={`/${locale}/search?q=${encodeURIComponent(query.trim())}`}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between px-4 py-3 text-sm font-medium text-teal-600 hover:bg-teal-50 transition-colors group"
              >
                <span>
                  {t("search.viewAll")}{" "}
                  <span className="font-semibold">&quot;{query}&quot;</span>
                </span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
