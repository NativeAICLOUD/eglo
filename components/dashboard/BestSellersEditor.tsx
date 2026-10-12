"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { ArrowDown, ArrowUp, Check, ImageOff, Plus, Search, Star, Trash2 } from "lucide-react"
import { apiService, BackendProduct, BestSellerPick, parseProductName, trimmedImageSrc } from "../../lib/api"
import { Input } from "../Input"

function Thumb({ url }: { url: string | null }) {
  return (
    <div className="w-12 h-12 flex-shrink-0 rounded-md border border-gray-100 bg-white flex items-center justify-center overflow-hidden">
      {url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={trimmedImageSrc(url, 200)} alt="" className="w-full h-full object-contain" />
        : <ImageOff className="w-4 h-4 text-gray-300" />}
    </div>
  )
}

// Picks the products shown in the homepage "Best sellers" section and their order.
export function BestSellersEditor() {
  const t = useTranslations("dashboard.settings.bestSellers")
  const [picked, setPicked] = useState<BestSellerPick[]>([])
  const [maxProducts, setMaxProducts] = useState(20)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<BackendProduct[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    apiService.getBestSellerSettings()
      .then(s => {
        setPicked(s.products)
        setMaxProducts(s.maxProducts)
        setUpdatedAt(s.updatedAt)
      })
      .catch(() => setError(t("errors.loadFailed")))
      .finally(() => setLoading(false))
  }, [t])

  // Search the catalog as the admin types (debounced)
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setResults([]); return }
    let cancelled = false
    setSearching(true)
    const timer = setTimeout(() => {
      apiService.getProducts({ search: q, page: 1, pageSize: 10 })
        .then(r => { if (!cancelled) setResults(r.items) })
        .catch(() => { if (!cancelled) setResults([]) })
        .finally(() => { if (!cancelled) setSearching(false) })
    }, 300)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [query])

  const change = (next: BestSellerPick[]) => {
    setPicked(next)
    setSaved(false)
  }

  const add = (p: BackendProduct) => {
    if (picked.some(x => x.id === p.id) || picked.length >= maxProducts) return
    change([...picked, { id: p.id, name: p.title, sku: p.sku, imageUrl: p.imageUrl, isPublished: true }])
  }

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta
    if (target < 0 || target >= picked.length) return
    const next = [...picked]
    ;[next[index], next[target]] = [next[target], next[index]]
    change(next)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      setUpdatedAt(await apiService.updateBestSellers(picked.map(p => p.id), updatedAt))
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.saveFailed"))
    } finally {
      setSaving(false)
    }
  }

  const full = picked.length >= maxProducts

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
      <div className="px-6 py-4 flex items-center gap-2">
        <Star className="w-4 h-4 text-teal-600" />
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{t("title")}</h3>
      </div>

      {loading ? (
        <div className="px-6 py-8 text-center text-sm text-gray-400">{t("loading")}</div>
      ) : (
        <div className="px-6 py-4 space-y-4">
          <p className="text-xs text-gray-400 -mt-1">{t("hint", { max: maxProducts })}</p>

          {/* Selected products, in homepage order */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{t("selected", { count: picked.length, max: maxProducts })}</span>
              {picked.length > 0 && (
                <button type="button" onClick={() => change([])} className="text-xs text-gray-500 hover:text-red-600">
                  {t("clear")}
                </button>
              )}
            </div>
            {picked.length === 0 ? (
              <p className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-lg px-4 py-3">{t("automatic")}</p>
            ) : (
              <ol className="space-y-2">
                {picked.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2">
                    <span className="w-5 text-xs text-gray-400 tabular-nums">{i + 1}</span>
                    <Thumb url={p.imageUrl} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{parseProductName(p.name)}</p>
                      <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
                      {(!p.isPublished || !p.imageUrl) && (
                        <p className="text-xs text-amber-600 mt-0.5">{!p.isPublished ? t("notPublished") : t("noImage")}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30" aria-label={t("moveUp")} title={t("moveUp")}>
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => move(i, 1)} disabled={i === picked.length - 1}
                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30" aria-label={t("moveDown")} title={t("moveDown")}>
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => change(picked.filter(x => x.id !== p.id))}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50" aria-label={t("remove")} title={t("remove")}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Add from the catalog */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t("addLabel")}</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder={t("searchPlaceholder")} className="pl-9" />
            </div>
            {query.trim().length >= 2 && (
              <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {searching && results.length === 0 ? (
                  <p className="px-3 py-3 text-sm text-gray-400">{t("searching")}</p>
                ) : results.length === 0 ? (
                  <p className="px-3 py-3 text-sm text-gray-400">{t("noResults")}</p>
                ) : results.map(p => {
                  const already = picked.some(x => x.id === p.id)
                  return (
                    <div key={p.id} className="flex items-center gap-3 px-3 py-2">
                      <Thumb url={p.imageUrl} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 line-clamp-1">{parseProductName(p.title)}</p>
                        <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => add(p)}
                        disabled={already || full}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors border-teal-500 text-teal-700 hover:bg-teal-50 disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent"
                      >
                        {already ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        {already ? t("added") : t("add")}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
            {full && <p className="text-xs text-amber-600">{t("full", { max: maxProducts })}</p>}
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? t("saving") : t("save")}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-teal-700">
                <Check className="w-4 h-4" />
                {t("saved")}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
