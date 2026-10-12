"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Eye, ImageOff } from "lucide-react"
import { apiService, parseProductName, trimmedImageSrc, TopProductsStats } from "../../lib/api"

const PERIODS = [7, 30, 90, 0] as const // 0 = all time

/** Dashboard overview: which products customers open and add to cart the most. */
export function TopProductsCard({ locale }: { locale: string }) {
  const t = useTranslations("dashboard.overview.topProducts")
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30)
  const [data, setData] = useState<TopProductsStats | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setData(null)
    setFailed(false)
    apiService.getTopProducts(days, 20)
      .then(d => { if (!cancelled) setData(d) })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [days])

  const maxViews = Math.max(1, ...(data?.items.map(i => i.views) ?? [0]))

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-5 flex flex-wrap items-start justify-between gap-3 border-b border-gray-100">
        <div>
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Eye className="w-4 h-4 text-teal-600" /> {t("title")}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {data
              ? t("summary", { views: data.totalViews.toLocaleString(), cartAdds: data.totalCartAdds.toLocaleString() })
              : t("subtitle")}
          </p>
        </div>
        <div className="flex rounded-lg border border-gray-200 p-0.5 text-xs font-medium" role="tablist">
          {PERIODS.map(p => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={days === p}
              onClick={() => setDays(p)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                days === p ? "bg-teal-600 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p === 0 ? t("periods.all") : t("periods.days", { days: p })}
            </button>
          ))}
        </div>
      </div>

      {failed ? (
        <p className="p-5 text-sm text-red-600">{t("error")}</p>
      ) : !data ? (
        <div className="p-5 space-y-3 animate-pulse">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}
        </div>
      ) : data.items.length === 0 ? (
        <p className="p-5 text-sm text-gray-500">{t("empty")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-100">
                <th className="px-5 py-2.5 font-medium w-8">#</th>
                <th className="py-2.5 font-medium">{t("columns.product")}</th>
                <th className="px-3 py-2.5 font-medium text-right">{t("columns.views")}</th>
                <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap">{t("columns.cartAdds")}</th>
                <th className="px-5 py-2.5 font-medium text-right">{t("columns.ordered")}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, idx) => {
                const name = item.name ? parseProductName(item.name) : t("deleted")
                return (
                  <tr key={item.productId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                    <td className="px-5 py-2.5 text-gray-400 tabular-nums">{idx + 1}</td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <div className="w-10 h-10 flex-shrink-0 rounded-md border border-gray-100 bg-white flex items-center justify-center overflow-hidden">
                          {item.imageUrl
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={trimmedImageSrc(item.imageUrl, 200)} alt="" className="w-full h-full object-contain" />
                            : <ImageOff className="w-4 h-4 text-gray-300" />}
                        </div>
                        <div className="min-w-0">
                          {item.exists ? (
                            <Link
                              href={`/${locale}/product/${item.productId}`}
                              target="_blank"
                              className="font-medium text-gray-900 hover:text-teal-600 line-clamp-1"
                            >
                              {name}
                            </Link>
                          ) : (
                            <span className="font-medium text-gray-400 line-clamp-1">{name}</span>
                          )}
                          {item.sku && <p className="text-xs text-gray-400 font-mono">{item.sku}</p>}
                          <div className="mt-1 h-1 rounded-full bg-gray-100 w-full max-w-[200px]">
                            <div className="h-1 rounded-full bg-teal-500" style={{ width: `${(item.views / maxViews) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-900 tabular-nums">{item.views.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right text-gray-700 tabular-nums">{item.cartAdds.toLocaleString()}</td>
                    <td className="px-5 py-2.5 text-right text-gray-700 tabular-nums">{item.ordered.toLocaleString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
