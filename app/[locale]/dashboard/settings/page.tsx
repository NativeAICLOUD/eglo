"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Bell, Shield, Globe, Check } from "lucide-react"

export default function DashboardSettingsPage() {
  const t = useTranslations("dashboard")
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("nav.settings")}</h1>
        <p className="text-gray-500 mt-1 text-sm">{t("settings.subtitle")}</p>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        <div className="px-6 py-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            {t("settings.notifications")}
          </h3>
        </div>
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{t("settings.emailNotifications")}</p>
            <p className="text-xs text-gray-500 mt-0.5">{t("settings.emailNotificationsDesc")}</p>
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
      </div>

      {/* Security placeholder */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        <div className="px-6 py-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            {t("settings.security")}
          </h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-400">{t("settings.comingSoon")}</p>
        </div>
      </div>

      {/* Localization placeholder */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        <div className="px-6 py-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            {t("settings.localization")}
          </h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-400">{t("settings.comingSoon")}</p>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {t("settings.saveChanges")}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-teal-700">
            <Check className="w-4 h-4" />
            {t("settings.saved")}
          </span>
        )}
      </div>
    </div>
  )
}
