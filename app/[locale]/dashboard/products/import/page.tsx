"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { ArrowLeft, FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, X } from "lucide-react"
import { apiService, formatMKD, PriceListImportResult } from "../../../../../lib/api"

type Tab = "priceChanges" | "newProducts" | "skipped"

export default function ImportPriceListPage() {
  const { locale } = useParams() as { locale: string }
  const t = useTranslations("dashboard.products.import")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [checking, setChecking] = useState(false)
  const [applying, setApplying] = useState(false)
  const [preview, setPreview] = useState<PriceListImportResult | null>(null)
  const [result, setResult] = useState<PriceListImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>("priceChanges")

  const chooseFile = (f: File | null) => {
    setFile(f)
    setPreview(null)
    setResult(null)
    setError(null)
    if (f && !/\.xlsx$/i.test(f.name)) setError(t("errors.notXlsx"))
  }

  const checkFile = async () => {
    if (!file) return
    setChecking(true)
    setError(null)
    try {
      const p = await apiService.importPriceList(file, true)
      setPreview(p)
      setTab(p.priceChanges.length > 0 ? "priceChanges" : p.newProducts.length > 0 ? "newProducts" : "skipped")
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errors.checkFailed"))
    } finally {
      setChecking(false)
    }
  }

  const applyImport = async () => {
    if (!file) return
    setApplying(true)
    setError(null)
    try {
      setResult(await apiService.importPriceList(file, false))
      setPreview(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errors.applyFailed"))
    } finally {
      setApplying(false)
    }
  }

  const reset = () => {
    chooseFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const hasChanges = !!preview && (preview.created + preview.priceChanged + preview.nameChanged) > 0

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <Link
          href={`/${locale}/dashboard/products`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t("back")}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{t("title")}</h1>
        <p className="text-gray-500 mt-1 text-sm">{t("subtitle")}</p>
      </div>

      {/* Step 1: file */}
      {!result && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); chooseFile(e.dataTransfer.files?.[0] ?? null) }}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors
              ${dragging ? "border-teal-500 bg-teal-50" : "border-gray-300 hover:border-teal-400 hover:bg-gray-50"}`}
          >
            <FileSpreadsheet className="w-10 h-10 text-teal-500 mx-auto mb-3" />
            {file ? (
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-900">{t("dropHere")}</p>
                <p className="text-xs text-gray-400 mt-1">{t("formatHint")}</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={e => chooseFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={checkFile}
              disabled={!file || !/\.xlsx$/i.test(file.name) || checking || applying}
              className="inline-flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {checking
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Upload className="w-4 h-4" />}
              {checking ? t("checking") : t("check")}
            </button>
            {file && (
              <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">
                <X className="w-4 h-4" /> {t("clear")}
              </button>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>
      )}

      {/* Step 2: preview */}
      {preview && (
        <div className="space-y-4">
          <SummaryCards r={preview} t={t} />

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex gap-1 border-b border-gray-100 px-4 pt-3 overflow-x-auto">
              {([
                ["priceChanges", preview.priceChanged],
                ["newProducts", preview.created],
                ["skipped", preview.skipped],
              ] as [Tab, number][]).map(([key, count]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors
                    ${tab === key ? "border-teal-600 text-teal-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                >
                  {t(`tabs.${key}`)} <span className="ml-1 text-xs text-gray-400">{count.toLocaleString()}</span>
                </button>
              ))}
            </div>

            <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
              {tab === "priceChanges" && (
                <PreviewTable
                  empty={t("empty.priceChanges")}
                  headers={[t("cols.sku"), t("cols.name"), t("cols.oldPrice"), t("cols.newPrice"), t("cols.change")]}
                  rows={preview.priceChanges.map(p => {
                    const pct = p.oldPrice > 0 ? ((p.newPrice - p.oldPrice) / p.oldPrice) * 100 : 0
                    return [
                      p.sku, p.name, formatMKD(p.oldPrice), formatMKD(p.newPrice),
                      <span key="c" className={pct > 0 ? "text-red-600" : "text-teal-600"}>
                        {pct > 0 ? "+" : ""}{pct.toFixed(1)}%
                      </span>,
                    ]
                  })}
                  more={preview.priceChanged - preview.priceChanges.length}
                  moreLabel={n => t("more", { count: n })}
                />
              )}
              {tab === "newProducts" && (
                <PreviewTable
                  empty={t("empty.newProducts")}
                  headers={[t("cols.sku"), t("cols.name"), t("cols.price")]}
                  rows={preview.newProducts.map(p => [p.sku, p.name, formatMKD(p.price)])}
                  more={preview.created - preview.newProducts.length}
                  moreLabel={n => t("more", { count: n })}
                />
              )}
              {tab === "skipped" && (
                <PreviewTable
                  empty={t("empty.skipped")}
                  headers={[t("cols.row"), t("cols.reason"), t("cols.sku"), t("cols.name")]}
                  rows={preview.skippedRows.map(s => [String(s.row), s.reason, s.sku ?? "—", s.name ?? "—"])}
                  more={preview.skipped - preview.skippedRows.length}
                  moreLabel={n => t("more", { count: n })}
                />
              )}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <p className="text-sm text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {hasChanges ? t("applyWarning") : t("nothingToApply")}
            </p>
            <button
              onClick={applyImport}
              disabled={!hasChanges || applying}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap inline-flex items-center gap-2"
            >
              {applying && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {applying ? t("applying") : t("apply")}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: done */}
      {result && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-teal-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t("doneTitle")}</h2>
              <p className="text-sm text-gray-500">{file?.name}</p>
            </div>
          </div>
          <SummaryCards r={result} t={t} />
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/${locale}/dashboard/products`}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {t("goToProducts")}
            </Link>
            <button onClick={reset} className="px-5 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              {t("importAnother")}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCards({ r, t }: { r: PriceListImportResult; t: ReturnType<typeof useTranslations> }) {
  const cards = [
    { label: t("summary.rowsRead"), value: r.rowsRead, tone: "text-gray-900" },
    { label: t("summary.created"), value: r.created, tone: "text-teal-700" },
    { label: t("summary.priceChanged"), value: r.priceChanged, tone: "text-blue-700" },
    { label: t("summary.nameChanged"), value: r.nameChanged, tone: "text-gray-700" },
    { label: t("summary.unchanged"), value: r.unchanged, tone: "text-gray-500" },
    { label: t("summary.skipped"), value: r.skipped, tone: r.skipped > 0 ? "text-amber-700" : "text-gray-500" },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map(c => (
        <div key={c.label} className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
          <p className="text-xs text-gray-500">{c.label}</p>
          <p className={`text-xl font-bold mt-1 ${c.tone}`}>{c.value.toLocaleString()}</p>
        </div>
      ))}
    </div>
  )
}

function PreviewTable({ headers, rows, empty, more, moreLabel }: {
  headers: string[]
  rows: React.ReactNode[][]
  empty: string
  more: number
  moreLabel: (count: number) => string
}) {
  if (rows.length === 0) return <p className="px-6 py-10 text-center text-sm text-gray-400">{empty}</p>
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 sticky top-0">
        <tr>
          {headers.map(h => (
            <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.map((cells, i) => (
          <tr key={i} className="hover:bg-gray-50">
            {cells.map((c, j) => (
              <td key={j} className={`px-4 py-2 ${j === 0 ? "font-mono text-xs text-gray-500" : "text-gray-700"} ${j === 1 ? "max-w-[320px] truncate" : "whitespace-nowrap"}`}>
                {c}
              </td>
            ))}
          </tr>
        ))}
        {more > 0 && (
          <tr>
            <td colSpan={headers.length} className="px-4 py-3 text-center text-xs text-gray-400">
              {moreLabel(more)}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}
