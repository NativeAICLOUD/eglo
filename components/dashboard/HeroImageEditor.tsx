"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Check, ImageIcon, RotateCcw, Upload } from "lucide-react"
import { apiService, DEFAULT_HERO_IMAGE } from "../../lib/api"

// Changes the large banner image at the top of the homepage.
export function HeroImageEditor() {
  const t = useTranslations("dashboard.settings.hero")
  const tHero = useTranslations("heroSection")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    apiService.getHero()
      .then(s => { setImageUrl(s.imageUrl); setUpdatedAt(s.updatedAt) })
      .catch(() => setError(t("errors.loadFailed")))
      .finally(() => setLoading(false))
  }, [t])

  const handleFile = async (file: File | null) => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      setImageUrl(await apiService.uploadHeroImage(file))
      setSaved(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.uploadFailed"))
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ""
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      setUpdatedAt(await apiService.updateHero(imageUrl, updatedAt))
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.saveFailed"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
      <div className="px-6 py-4 flex items-center gap-2">
        <ImageIcon className="w-4 h-4 text-teal-600" />
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{t("title")}</h3>
      </div>

      {loading ? (
        <div className="px-6 py-8 text-center text-sm text-gray-400">{t("loading")}</div>
      ) : (
        <div className="px-6 py-4 space-y-4">
          <p className="text-xs text-gray-400 -mt-1">{t("hint")}</p>

          {/* Preview with the same dark gradient the homepage puts over the image */}
          <div className="relative aspect-[3/1] rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
            <Image src={imageUrl || DEFAULT_HERO_IMAGE} alt="" fill className="object-cover object-center" sizes="800px" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#24150c]/75 via-[#24150c]/35 to-transparent" />
            <div className="absolute inset-y-0 left-0 flex flex-col justify-center px-6 max-w-[55%]">
              <p className="text-[#fbf3e8] text-lg sm:text-2xl font-semibold leading-tight">{tHero("title")}</p>
            </div>
            {!imageUrl && (
              <span className="absolute top-2 right-2 text-[11px] font-medium bg-white/90 text-gray-700 px-2 py-0.5 rounded-full">
                {t("defaultBadge")}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => handleFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading || saving}
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:border-teal-400 hover:text-teal-600 transition-colors disabled:opacity-60"
            >
              {uploading
                ? <span className="w-3.5 h-3.5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                : <Upload className="w-3.5 h-3.5" />}
              {uploading ? t("uploading") : t("upload")}
            </button>
            {imageUrl && (
              <button
                type="button"
                onClick={() => { setImageUrl(null); setSaved(false) }}
                disabled={uploading || saving}
                className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-60"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t("useDefault")}
              </button>
            )}
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? t("saving") : t("save")}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-teal-700">
                <Check className="w-4 h-4" />
                {t("saved")}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
