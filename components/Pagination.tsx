"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"

interface PaginationProps {
  currentPage: number
  totalCount: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

const PAGE_SIZE_OPTIONS = [12, 24, 48]

function getPageNumbers(currentPage: number, totalPages: number): Array<number | "..."> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages]
  }

  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages]
}

export function Pagination({
  currentPage,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const t = useTranslations("pagination")

  if (totalCount === 0) return null

  const totalPages = Math.ceil(totalCount / pageSize)
  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalCount)
  const pages = getPageNumbers(currentPage, totalPages)

  const goTo = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    onPageChange(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-gray-200">
      {/* Left: article count */}
      <span className="text-sm text-gray-600 whitespace-nowrap order-2 sm:order-1">
        {t("items", { start, end, total: totalCount })}
      </span>

      {/* Center: page numbers */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 order-1 sm:order-2">
          {/* Previous */}
          <button
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg text-gray-500 hover:text-teal-600 hover:bg-teal-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label={t("prev")}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page numbers */}
          {pages.map((p, idx) =>
            p === "..." ? (
              <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 text-sm select-none">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => goTo(p as number)}
                className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition-colors ${
                  p === currentPage
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-gray-700 hover:text-teal-600 hover:bg-teal-50"
                }`}
              >
                {p}
              </button>
            )
          )}

          {/* Next */}
          <button
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg text-gray-500 hover:text-teal-600 hover:bg-teal-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label={t("next")}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Right: per-page dropdown */}
      <div className="flex items-center gap-2 order-3 whitespace-nowrap">
        <span className="text-sm text-gray-600">{t("perPage")}</span>
        <select
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
          className="h-9 px-2 pr-7 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
        >
          {PAGE_SIZE_OPTIONS.map(size => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
