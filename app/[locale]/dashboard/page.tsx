"use client"

import Link from "next/link"
import { Package, ShoppingCart, Users, TrendingUp, ArrowRight, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "../../../components/Button"
import { apiService } from "../../../lib/api"

export default function DashboardOverviewPage() {
  const t      = useTranslations("dashboard")
  const params = useParams()
  const locale = params.locale as string

  const [totalProducts,   setTotalProducts]   = useState<number | null>(null)
  const [totalCategories, setTotalCategories] = useState<number | null>(null)
  const [totalUsers,      setTotalUsers]      = useState<number | null>(null)

  useEffect(() => {
    apiService.getStats()
      .then(s => {
        setTotalProducts(s.totalProducts)
        setTotalCategories(s.totalCategories)
        setTotalUsers(s.totalUsers)
      })
      .catch(() => {})
  }, [])

  const fmt = (v: number | null) => v === null ? "…" : v.toLocaleString()

  const stats = [
    { key: "totalProducts", value: fmt(totalProducts), icon: Package,      color: "bg-teal-50  text-teal-600"  },
    { key: "totalOrders",   value: "—",                icon: ShoppingCart, color: "bg-blue-50  text-blue-600"  },
    { key: "totalUsers",    value: fmt(totalUsers),    icon: Users,        color: "bg-green-50 text-green-600" },
    { key: "revenue",       value: "—",                icon: TrendingUp,   color: "bg-amber-50 text-amber-600" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("overview.title")}</h1>
          <p className="text-gray-500 mt-1 text-sm">{t("overview.subtitle")}</p>
        </div>
        <Link href={`/${locale}/add-product`}>
          <Button variant="primary" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t("products.addProduct")}
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ key, value, icon: Icon, color }) => (
          <div key={key} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t(`overview.stats.${key}`)}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
              <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">{t("nav.products")}</h2>
            <Link href={`/${locale}/dashboard/products`} className="text-teal-600 hover:text-teal-700 text-sm flex items-center gap-1">
              {t("overview.viewAll")} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-sm text-gray-500">{t("overview.manageProducts")}</p>
          <div className="mt-4 flex gap-2">
            <Link href={`/${locale}/dashboard/products`}>
              <Button variant="outline" size="sm">{t("overview.viewAll")}</Button>
            </Link>
            <Link href={`/${locale}/add-product`}>
              <Button variant="primary" size="sm" className="flex items-center gap-1">
                <Plus className="w-3 h-3" /> {t("products.addProduct")}
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">{t("nav.categories")}</h2>
            <Link href={`/${locale}/dashboard/categories`} className="text-teal-600 hover:text-teal-700 text-sm flex items-center gap-1">
              {t("overview.viewAll")} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-sm text-gray-500">
            {t("overview.manageCategories")}
            {totalCategories !== null && (
              <span className="ml-2 text-xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                {totalCategories}
              </span>
            )}
          </p>
          <div className="mt-4">
            <Link href={`/${locale}/dashboard/categories`}>
              <Button variant="outline" size="sm">{t("overview.viewAll")}</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
