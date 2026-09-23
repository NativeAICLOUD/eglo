"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { Bell, Shield, Globe, Check, Megaphone, Upload, ImageOff, X, Languages } from "lucide-react"
import { useDashboardLocale } from "../../../../components/providers/DashboardLocaleProvider"
import {
  apiService,
  PromoPopupSettings,
  PromoPopupContent,
  PromoPopupLocale,
  PROMO_POPUP_LOCALES,
} from "../../../../lib/api"
import { Input } from "../../../../components/Input"

const LOCALES = [
  { code: "en", label: "English" },
  { code: "mk", label: "Македонски" },
  { code: "sq", label: "Shqip" },
] as const

const POPUP_LOCALE_LABELS: Record<PromoPopupLocale, string> = {
  mk: "Македонски",
  en: "English",
  sq: "Shqip",
}

const EMPTY_CONTENT: PromoPopupContent = { title: "", text: "", ctaText: null }

const EMPTY_POPUP: PromoPopupSettings = {
  enabled: false,
  imageUrl: null,
  ctaLink: null,
  translations: { mk: EMPTY_CONTENT, en: EMPTY_CONTENT, sq: EMPTY_CONTENT },
}

function isContentEmpty(c: PromoPopupContent): boolean {
  return !c.title.trim() && !c.text.trim() && !(c.ctaText ?? "").trim()
}

export default function DashboardSettingsPage() {
  const t = useTranslations("dashboard")
  const { locale: dashboardLocale, setLocale: setDashboardLocale } = useDashboardLocale()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [saved, setSaved] = useState(false)

  const [popup, setPopup] = useState<PromoPopupSettings>(EMPTY_POPUP)
  const [popupLoading, setPopupLoading] = useState(true)
  const [popupSaving, setPopupSaving] = useState(false)
  const [popupSaved, setPopupSaved] = useState(false)
  const [popupError, setPopupError] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [popupLang, setPopupLang] = useState<PromoPopupLocale>("mk")
  const [translating, setTranslating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    apiService.getPromoPopup()
      .then(setPopup)
      .catch(() => {})
      .finally(() => setPopupLoading(false))
  }, [])

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handlePopupImageSelected = async (file: File | null) => {
    if (!file) return
    setUploadingImage(true)
    setPopupError(null)
    try {
      const url = await apiService.uploadPromoPopupImage(file)
      setPopup(prev => ({ ...prev, imageUrl: url }))
    } catch (err) {
      setPopupError(err instanceof Error ? err.message : t("settings.promoPopup.errors.uploadFailed"))
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const content = popup.translations[popupLang]

  const setContent = (patch: Partial<PromoPopupContent>) =>
    setPopup(prev => ({
      ...prev,
      translations: { ...prev.translations, [popupLang]: { ...prev.translations[popupLang], ...patch } },
    }))

  /** Translates the active language into the others, overwriting them. */
  const handleTranslate = async () => {
    if (isContentEmpty(content)) {
      setPopupError(t("settings.promoPopup.errors.nothingToTranslate"))
      return
    }
    setTranslating(true)
    setPopupError(null)
    try {
      const translated = await apiService.translatePromoPopup(popupLang, content)
      setPopup(prev => ({ ...prev, translations: { ...prev.translations, ...translated, [popupLang]: content } }))
    } catch (err) {
      setPopupError(err instanceof Error ? err.message : t("settings.promoPopup.errors.translateFailed"))
    } finally {
      setTranslating(false)
    }
  }

  const handleSavePopup = async () => {
    setPopupSaving(true)
    setPopupError(null)
    setPopupSaved(false)
    try {
      // Languages left empty are filled by machine translation from the one being edited
      // (or, if that one is empty too, the first language that has content).
      let toSave = popup
      const emptyLocales = PROMO_POPUP_LOCALES.filter(l => isContentEmpty(popup.translations[l]))
      const source = !isContentEmpty(popup.translations[popupLang])
        ? popupLang
        : PROMO_POPUP_LOCALES.find(l => !isContentEmpty(popup.translations[l]))
      if (source && emptyLocales.length > 0) {
        setTranslating(true)
        try {
          const translated = await apiService.translatePromoPopup(source, popup.translations[source])
          const translations = { ...popup.translations }
          for (const l of emptyLocales) translations[l] = translated[l]
          toSave = { ...popup, translations }
          setPopup(toSave)
        } finally {
          setTranslating(false)
        }
      }
      await apiService.updatePromoPopup(toSave)
      setPopupSaved(true)
      setTimeout(() => setPopupSaved(false), 2500)
    } catch (err) {
      setPopupError(err instanceof Error ? err.message : t("settings.promoPopup.errors.saveFailed"))
    } finally {
      setPopupSaving(false)
    }
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

      {/* Promotional popup */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              {t("settings.promoPopup.title")}
            </h3>
          </div>
          {!popupLoading && (
            <button
              onClick={() => setPopup(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0
                ${popup.enabled ? "bg-teal-600" : "bg-gray-200"}`}
              aria-label={t("settings.promoPopup.enabled")}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                ${popup.enabled ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          )}
        </div>

        {popupLoading ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">{t("settings.promoPopup.loading")}</div>
        ) : (
          <div className="px-6 py-4 space-y-4">
            <p className="text-xs text-gray-400 -mt-1">{t("settings.promoPopup.hint")}</p>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  {PROMO_POPUP_LOCALES.map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setPopupLang(l)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                        ${popupLang === l ? "bg-white text-teal-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      {POPUP_LOCALE_LABELS[l]}
                      {isContentEmpty(popup.translations[l]) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title={t("settings.promoPopup.missingTranslation")} />
                      )}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleTranslate}
                  disabled={translating || popupSaving}
                  className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:border-teal-400 hover:text-teal-600 transition-colors disabled:opacity-60"
                >
                  {translating
                    ? <span className="w-3.5 h-3.5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    : <Languages className="w-3.5 h-3.5" />
                  }
                  {translating
                    ? t("settings.promoPopup.translating")
                    : t("settings.promoPopup.translate", { language: POPUP_LOCALE_LABELS[popupLang] })}
                </button>
              </div>
              <p className="text-xs text-gray-400">{t("settings.promoPopup.translateHint")}</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">{t("settings.promoPopup.fields.title")}</label>
              <Input
                value={content.title}
                onChange={e => setContent({ title: e.target.value })}
                placeholder={t("settings.promoPopup.fields.titlePlaceholder")}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">{t("settings.promoPopup.fields.text")}</label>
              <textarea
                value={content.text}
                onChange={e => setContent({ text: e.target.value })}
                rows={3}
                placeholder={t("settings.promoPopup.fields.textPlaceholder")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{t("settings.promoPopup.fields.ctaText")}</label>
                <Input
                  value={content.ctaText ?? ""}
                  onChange={e => setContent({ ctaText: e.target.value })}
                  placeholder={t("settings.promoPopup.fields.ctaTextPlaceholder")}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{t("settings.promoPopup.fields.ctaLink")}</label>
                <Input
                  value={popup.ctaLink ?? ""}
                  onChange={e => setPopup(prev => ({ ...prev, ctaLink: e.target.value }))}
                  placeholder="/mk/category/interior-lights"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{t("settings.promoPopup.fields.image")}</label>
              {popup.imageUrl ? (
                <div className="relative w-40 aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group">
                  <Image src={popup.imageUrl} alt="" fill className="object-cover" sizes="160px" />
                  <button
                    type="button"
                    onClick={() => setPopup(prev => ({ ...prev, imageUrl: null }))}
                    className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label={t("settings.promoPopup.fields.removeImage")}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-40 aspect-square rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-300">
                  <ImageOff className="w-6 h-6" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handlePopupImageSelected(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:border-teal-400 hover:text-teal-600 transition-colors disabled:opacity-60"
              >
                {uploadingImage
                  ? <span className="w-3.5 h-3.5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                  : <Upload className="w-3.5 h-3.5" />
                }
                {uploadingImage ? t("settings.promoPopup.fields.uploading") : t("settings.promoPopup.fields.uploadImage")}
              </button>
            </div>

            {popupError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{popupError}</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSavePopup}
                disabled={popupSaving || translating}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {translating && popupSaving ? t("settings.promoPopup.translating") : popupSaving ? t("settings.promoPopup.saving") : t("settings.promoPopup.save")}
              </button>
              {popupSaved && (
                <span className="flex items-center gap-1.5 text-sm text-teal-700">
                  <Check className="w-4 h-4" />
                  {t("settings.saved")}
                </span>
              )}
            </div>
          </div>
        )}
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

      {/* Localization — dashboard language is independent of the public site's locale */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        <div className="px-6 py-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            {t("settings.localization")}
          </h3>
        </div>
        <div className="px-6 py-4">
          <div className="flex gap-3">
            {LOCALES.map(l => (
              <button
                key={l.code}
                onClick={() => setDashboardLocale(l.code)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors
                  ${dashboardLocale === l.code
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-gray-200 text-gray-600 hover:border-teal-300 hover:bg-gray-50"
                  }`}
              >
                {dashboardLocale === l.code && <Check className="w-3.5 h-3.5" />}
                {l.label}
              </button>
            ))}
          </div>
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
