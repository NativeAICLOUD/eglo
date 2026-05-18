"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Bell, Globe, Check } from "lucide-react"
import Link from "next/link"
import { useAuth } from "../../../lib/useAuth"
import { PageSpinner } from "../../../components/Spinner"

export default function SettingsPage() {
  const { isAuthenticated, initialized } = useAuth()
  const router = useRouter()
  const { locale } = useParams() as { locale: string }
  const t = useTranslations("settings")

  const [emailNotifications, setEmailNotifications] = useState(true)
  const [orderUpdates, setOrderUpdates] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!initialized) return
    if (!isAuthenticated) router.replace(`/${locale}/login`)
  }, [initialized, isAuthenticated, locale, router])

  if (!initialized || !isAuthenticated) return <PageSpinner />

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const locales = [
    { code: "mk", label: "Македонски" },
    { code: "sq", label: "Shqip" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-500 mt-1 text-sm">{t("subtitle")}</p>
        </div>

        {/* Language */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          <div className="px-6 py-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              {t("language")}
            </h3>
          </div>
          <div className="px-6 py-4">
            <p className="text-xs text-gray-500 mb-3">{t("languageDesc")}</p>
            <div className="flex gap-3">
              {locales.map(l => (
                <Link
                  key={l.code}
                  href={`/${l.code}/settings`}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors
                    ${locale === l.code
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-gray-200 text-gray-600 hover:border-teal-300 hover:bg-gray-50"
                    }`}
                >
                  {locale === l.code && <Check className="w-3.5 h-3.5" />}
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          <div className="px-6 py-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              {t("notifications")}
            </h3>
          </div>

          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{t("emailNotifications")}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t("emailNotificationsDesc")}</p>
            </div>
            <button
              onClick={() => setEmailNotifications(v => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${emailNotifications ? "bg-teal-600" : "bg-gray-200"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                ${emailNotifications ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>

          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{t("orderUpdates")}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t("orderUpdatesDesc")}</p>
            </div>
            <button
              onClick={() => setOrderUpdates(v => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${orderUpdates ? "bg-teal-600" : "bg-gray-200"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                ${orderUpdates ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {t("saveChanges")}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-teal-700">
              <Check className="w-4 h-4" />
              {t("saved")}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
