"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { User, Mail, Shield } from "lucide-react"
import { useAuth } from "../../../lib/useAuth"
import { PageSpinner } from "../../../components/Spinner"

export default function ProfilePage() {
  const { user, isAuthenticated, initialized } = useAuth()
  const router = useRouter()
  const { locale } = useParams() as { locale: string }
  const t = useTranslations("profile")

  useEffect(() => {
    if (!initialized) return
    if (!isAuthenticated) router.replace(`/${locale}/login`)
  }, [initialized, isAuthenticated, locale, router])

  if (!initialized || !isAuthenticated) return <PageSpinner />

  const roleLabel = user?.roles && user.roles.length > 0
    ? user.roles.join(", ")
    : "—"

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-500 mt-1 text-sm">{t("subtitle")}</p>
        </div>

        {/* Avatar + account card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Teal banner */}
          <div className="h-20 bg-gradient-to-r from-teal-500 to-teal-600" />

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="-mt-10 mb-4">
              <div className="w-20 h-20 rounded-full bg-teal-600 text-white flex items-center justify-center text-3xl font-bold border-4 border-white shadow">
                {(user?.email?.[0] ?? "U").toUpperCase()}
              </div>
            </div>

            <h2 className="text-lg font-semibold text-gray-900">
              {user?.email}
            </h2>
            {user?.roles && user.roles.length > 0 && (
              <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700">
                <Shield className="w-3 h-3" />
                {roleLabel}
              </span>
            )}
          </div>
        </div>

        {/* Account info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          <div className="px-6 py-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              {t("accountInfo")}
            </h3>
          </div>

          <div className="px-6 py-4 flex items-center gap-3">
            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">{t("email")}</p>
              <p className="text-sm text-gray-900 font-medium">{user?.email ?? "—"}</p>
            </div>
          </div>

          <div className="px-6 py-4 flex items-center gap-3">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">{t("userId")}</p>
              <p className="text-sm text-gray-500 font-mono">{user?.id ?? "—"}</p>
            </div>
          </div>

          {user?.roles && user.roles.length > 0 && (
            <div className="px-6 py-4 flex items-center gap-3">
              <Shield className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">{t("roles")}</p>
                <p className="text-sm text-gray-900 font-medium">{roleLabel}</p>
              </div>
            </div>
          )}
        </div>

        {/* Change password — placeholder */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-1">
            {t("changePassword")}
          </h3>
          <p className="text-sm text-gray-400">{t("comingSoon")}</p>
        </div>
      </div>
    </div>
  )
}
