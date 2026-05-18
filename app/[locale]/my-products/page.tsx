"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Package } from "lucide-react"
import Link from "next/link"
import { useAuth } from "../../../lib/useAuth"
import { PageSpinner } from "../../../components/Spinner"

export default function MyProductsPage() {
  const { isAuthenticated, initialized } = useAuth()
  const router = useRouter()
  const { locale } = useParams() as { locale: string }
  const t = useTranslations("myProducts")

  useEffect(() => {
    if (!initialized) return
    if (!isAuthenticated) router.replace(`/${locale}/login`)
  }, [initialized, isAuthenticated, locale, router])

  if (!initialized || !isAuthenticated) return <PageSpinner />

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-500 mt-1 text-sm">{t("subtitle")}</p>
        </div>

        {/* Empty state */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-teal-500" />
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">{t("noProducts")}</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-xs">{t("noProductsDesc")}</p>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {t("browse")}
          </Link>
        </div>
      </div>
    </div>
  )
}
