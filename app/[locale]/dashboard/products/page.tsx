"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Plus, Search, Pencil, Trash2, X, ChevronLeft, ChevronRight, Tag } from "lucide-react"
import { Button } from "../../../../components/Button"
import { Input } from "../../../../components/Input"
import { apiService, BackendCategory, BackendProduct, parseProductName, formatMKD } from "../../../../lib/api"
import { Spinner } from "../../../../components/Spinner"

const PAGE_SIZE = 20

// ─── Helpers ─────────────────────────────────────────────────────────────────
interface FlatCategory { id: string; name: string; depth: number }

function flattenCategories(cats: BackendCategory[], depth = 0): FlatCategory[] {
  const out: FlatCategory[] = []
  for (const c of cats) {
    out.push({ id: c.id, name: c.name, depth })
    if (c.subcategories?.length) out.push(...flattenCategories(c.subcategories, depth + 1))
  }
  return out
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ name, onConfirm, onCancel, deleting, t }: {
  name: string; onConfirm: () => void; onCancel: () => void; deleting: boolean
  t: (k: string) => string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <button onClick={onCancel} disabled={deleting} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 text-center">{t("products.deleteModal.title")}</h3>
        <p className="text-sm text-gray-500 text-center mt-2">
          {t("products.deleteModal.message")} <span className="font-medium text-gray-900">&quot;{name}&quot;</span>?
        </p>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={deleting}>
            {t("products.deleteModal.cancel")}
          </Button>
          <Button variant="destructive" className="flex-1 flex items-center justify-center gap-2" onClick={onConfirm} disabled={deleting}>
            {deleting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {t("products.deleteModal.confirm")}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Bulk Assign Modal ────────────────────────────────────────────────────────
function BulkAssignModal({ count, flatCategories, onConfirm, onCancel, t }: {
  count: number
  flatCategories: FlatCategory[]
  onConfirm: (categoryId: string) => Promise<void>
  onCancel: () => void
  t: (k: string) => string
}) {
  const [categoryId, setCategoryId] = useState("")
  const [assigning,  setAssigning]  = useState(false)
  const [error,      setError]      = useState("")

  const handleConfirm = async () => {
    if (!categoryId) return
    setAssigning(true)
    setError("")
    try {
      await onConfirm(categoryId)
    } catch {
      setError(t("products.bulkAssign.error"))
      setAssigning(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <button onClick={onCancel} disabled={assigning} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 mx-auto mb-4">
          <Tag className="w-6 h-6 text-teal-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 text-center">{t("products.bulkAssign.title")}</h3>
        <p className="text-sm text-gray-500 text-center mt-1 mb-4">
          {t("products.bulkAssign.subtitle").replace("{count}", String(count))}
        </p>

        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="">{t("products.bulkAssign.selectCategory")}</option>
          {flatCategories.map(c => (
            <option key={c.id} value={c.id}>
              {"\u00A0".repeat(c.depth * 3)}{c.name}
            </option>
          ))}
        </select>

        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

        <div className="flex gap-3 mt-5">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={assigning}>
            {t("products.deleteModal.cancel")}
          </Button>
          <Button
            variant="primary"
            className="flex-1 flex items-center justify-center gap-2"
            onClick={handleConfirm}
            disabled={!categoryId || assigning}
          >
            {assigning && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {t("products.bulkAssign.assign")}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardProductsPage() {
  const params = useParams()
  const locale = params.locale as string
  const t      = useTranslations("dashboard")

  // Data
  const [products,      setProducts]      = useState<BackendProduct[]>([])
  const [totalCount,    setTotalCount]    = useState(0)
  const [loading,       setLoading]       = useState(true)
  const [categories,    setCategories]    = useState<BackendCategory[]>([])
  const [uncategorized, setUncategorized] = useState<number | null>(null)

  // Filters
  const [search,          setSearch]          = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [filterCat,       setFilterCat]       = useState("")
  const [onlyUncat,       setOnlyUncat]       = useState(false)
  const [page,            setPage]            = useState(1)

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Modals
  const [deleteTarget,   setDeleteTarget]   = useState<BackendProduct | null>(null)
  const [deleting,       setDeleting]       = useState(false)
  const [showBulkAssign, setShowBulkAssign] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Debounce search ──────────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  // ── Reset page on filter change ──────────────────────────────────────────
  useEffect(() => { setPage(1); setSelectedIds(new Set()) }, [filterCat, onlyUncat])

  // ── Load categories + stats ──────────────────────────────────────────────
  useEffect(() => {
    apiService.getCategories().then(setCategories).catch(() => setCategories([]))
    apiService.getProductCategoryStats()
      .then(s => setUncategorized(s.uncategorized))
      .catch(() => {})
  }, [])

  // ── Load products ────────────────────────────────────────────────────────
  const fetchProducts = useCallback(() => {
    setLoading(true)
    setSelectedIds(new Set())
    apiService.getProducts({
      page,
      pageSize: PAGE_SIZE,
      ...(debouncedSearch  ? { search: debouncedSearch }    : {}),
      ...(filterCat && !onlyUncat ? { categoryId: filterCat } : {}),
      ...(onlyUncat        ? { uncategorized: true }         : {}),
    })
      .then(data => { setProducts(data.items); setTotalCount(data.totalCount) })
      .catch(() => { setProducts([]); setTotalCount(0) })
      .finally(() => setLoading(false))
  }, [page, debouncedSearch, filterCat, onlyUncat])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  // ── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const pageWindow = (() => {
    const delta = 3
    const start = Math.max(1, page - delta)
    const end   = Math.min(totalPages, page + delta)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  })()

  // ── Selection helpers ────────────────────────────────────────────────────
  const allSelected  = products.length > 0 && products.every(p => selectedIds.has(p.id))
  const someSelected = products.some(p => selectedIds.has(p.id))

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(products.map(p => p.id)))
  }
  const toggleOne = (id: string) =>
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  // ── Delete ───────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await apiService.deleteProduct(deleteTarget.id)
      setProducts(prev => prev.filter(p => p.id !== deleteTarget.id))
      setTotalCount(prev => Math.max(0, prev - 1))
    } catch { /* keep row visible on failure */ } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  // ── Bulk assign ───────────────────────────────────────────────────────────
  const handleBulkAssign = async (categoryId: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    const res = await fetch("/api/products/bulk-category", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ productIds: [...selectedIds], categoryId }),
    })
    if (!res.ok) throw new Error("assign failed")
    setShowBulkAssign(false)
    // Refresh stats and current page
    apiService.getProductCategoryStats().then(s => setUncategorized(s.uncategorized)).catch(() => {})
    fetchProducts()
  }

  const flatCategories = flattenCategories(categories)
  const selectionCount = selectedIds.size

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{t("products.title")}</h1>
            {uncategorized !== null && uncategorized > 0 && (
              <button
                onClick={() => { setOnlyUncat(true); setFilterCat("") }}
                className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                title={t("products.bulkAssign.uncategorizedHint")}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {uncategorized.toLocaleString()} {t("products.uncategorized")}
              </button>
            )}
          </div>
          <p className="text-gray-500 mt-1 text-sm">{t("products.subtitle")}</p>
        </div>
        <Link href={`/${locale}/add-product`}>
          <Button variant="primary" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t("products.addProduct")}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("products.search")}
            className="pl-9"
          />
        </div>
        <select
          value={filterCat}
          onChange={e => { setFilterCat(e.target.value); setOnlyUncat(false) }}
          className="h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="">{t("products.filterCategory")}</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button
          onClick={() => { setOnlyUncat(v => !v); setFilterCat("") }}
          className={`h-9 px-3 text-sm rounded-md border transition-colors font-medium
            ${onlyUncat
              ? "bg-amber-100 border-amber-300 text-amber-800"
              : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}
        >
          {t("products.filterUncategorized")}
          {uncategorized !== null && (
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${onlyUncat ? "bg-amber-200" : "bg-gray-100"}`}>
              {uncategorized.toLocaleString()}
            </span>
          )}
        </button>
        {(filterCat || onlyUncat || search) && (
          <button
            onClick={() => { setSearch(""); setFilterCat(""); setOnlyUncat(false) }}
            className="h-9 px-3 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> {t("products.clearFilters")}
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {selectionCount > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-teal-800">
            {selectionCount} {t("products.selected")}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 border-teal-300 text-teal-700 hover:bg-teal-100"
              onClick={() => setShowBulkAssign(true)}
            >
              <Tag className="w-3.5 h-3.5" />
              {t("products.bulkAssign.button")}
            </Button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-teal-600 hover:text-teal-800 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {/* Checkbox column */}
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = !allSelected && someSelected }}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                </th>
                {["image","name","sku","price","category","created","actions"].map(col => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t(`products.table.${col}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex justify-center">
                      <Spinner size="sm" />
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    {t("products.noResults")}
                  </td>
                </tr>
              ) : products.map(product => {
                const displayName = parseProductName(product.title)
                const isSelected  = selectedIds.has(product.id)
                const catName = product.subcategoryName ?? product.categoryName ?? null
                return (
                  <tr
                    key={product.id}
                    className={`hover:bg-gray-50 transition-colors ${isSelected ? "bg-teal-50/40" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(product.id)}
                        className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                        {product.imageUrl
                          ? <img
                              src={product.imageUrl}
                              alt={displayName}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg' }}
                            />
                          : <img src="/placeholder.svg" alt={displayName} className="w-full h-full object-cover" />
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate" title={displayName}>
                      {displayName}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{product.sku || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{formatMKD(product.price)}</td>
                    <td className="px-4 py-3">
                      {catName
                        ? <span className="text-gray-700 text-xs">{catName}</span>
                        : <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            {t("products.unassigned")}
                          </span>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-500">{product.createdDate.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/${locale}/dashboard/products/${product.id}/edit`}>
                          <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-500 hover:text-teal-600">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost" size="icon"
                          className="w-8 h-8 text-gray-500 hover:text-red-600"
                          onClick={() => setDeleteTarget(product)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <span>
            {t("products.pagination.showing")}{" "}
            {totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} / {totalCount}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="w-8 h-8" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {pageWindow[0] > 1 && (
              <>
                <button onClick={() => setPage(1)} className="w-8 h-8 rounded-md text-sm hover:bg-gray-100 text-gray-600">1</button>
                {pageWindow[0] > 2 && <span className="px-1 text-gray-400">…</span>}
              </>
            )}
            {pageWindow.map(n => (
              <button key={n} onClick={() => setPage(n)}
                className={`w-8 h-8 rounded-md text-sm transition-colors
                  ${n === page ? "bg-teal-600 text-white font-medium" : "hover:bg-gray-100 text-gray-600"}`}>
                {n}
              </button>
            ))}
            {pageWindow[pageWindow.length - 1] < totalPages && (
              <>
                {pageWindow[pageWindow.length - 1] < totalPages - 1 && <span className="px-1 text-gray-400">…</span>}
                <button onClick={() => setPage(totalPages)} className="w-8 h-8 rounded-md text-sm hover:bg-gray-100 text-gray-600">{totalPages}</button>
              </>
            )}
            <Button variant="ghost" size="icon" className="w-8 h-8" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete modal */}
      {deleteTarget && (
        <DeleteModal
          name={parseProductName(deleteTarget.title)}
          onConfirm={confirmDelete}
          onCancel={() => { if (!deleting) setDeleteTarget(null) }}
          deleting={deleting}
          t={t as unknown as (k: string) => string}
        />
      )}

      {/* Bulk assign modal */}
      {showBulkAssign && (
        <BulkAssignModal
          count={selectionCount}
          flatCategories={flatCategories}
          onConfirm={handleBulkAssign}
          onCancel={() => setShowBulkAssign(false)}
          t={t as unknown as (k: string) => string}
        />
      )}
    </div>
  )
}
