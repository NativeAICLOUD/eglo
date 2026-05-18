"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Tag, Plus } from "lucide-react"
import { Button } from "../../../../components/Button"
import { apiService, BackendCategory } from "../../../../lib/api"
import { Spinner } from "../../../../components/Spinner"

export default function DashboardCategoriesPage() {
  const t = useTranslations("dashboard")
  const [categories, setCategories] = useState<BackendCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiService.getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("nav.categories")}</h1>
          <p className="text-gray-500 mt-1 text-sm">{t("categories.subtitle")}</p>
        </div>
        <Button variant="primary" className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t("categories.addCategory")}
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) :categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mb-4">
              <Tag className="w-7 h-7 text-teal-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">{t("categories.noCategories")}</h3>
            <p className="text-sm text-gray-400">{t("categories.noCategoriesDesc")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["name", "slug", "subcategories"].map(col => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t(`categories.table.${col}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-teal-500 flex-shrink-0" />
                      {cat.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{cat.slug}</td>
                    <td className="px-4 py-3 text-gray-500">{cat.subcategories?.length ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
