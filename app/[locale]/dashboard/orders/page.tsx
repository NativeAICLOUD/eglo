"use client"

import { useTranslations } from "next-intl"
import { ShoppingCart } from "lucide-react"

export default function DashboardOrdersPage() {
  const t = useTranslations("dashboard")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("nav.orders")}</h1>
        <p className="text-gray-500 mt-1 text-sm">{t("orders.subtitle")}</p>
      </div>

      {/* Empty state */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mb-4">
          <ShoppingCart className="w-7 h-7 text-teal-500" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">{t("orders.noOrders")}</h3>
        <p className="text-sm text-gray-400 max-w-xs">{t("orders.noOrdersDesc")}</p>
      </div>
    </div>
  )
}
