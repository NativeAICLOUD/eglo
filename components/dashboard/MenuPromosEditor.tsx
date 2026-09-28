"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Check, ImageOff, LayoutPanelTop, Plus, Trash2, Upload } from "lucide-react"
import { apiService, BackendCategory, MenuPromoCards, PROMO_POPUP_LOCALES, PromoPopupLocale } from "../../lib/api"
import { categoryPromos, type PromoCard } from "../../lib/megaMenuPromos"
import { Input } from "../Input"

// The mega-menu's promo column fits two cards.
const MAX_CARDS = 2

const LOCALE_LABELS: Record<PromoPopupLocale, string> = { mk: "Македонски", en: "English", sq: "Shqip" }

const emptyCard = (slug: string): PromoCard => ({
  image: "",
  title: {},
  description: {},
  ctaText: {},
  ctaSlug: `/category/${slug}`,
})

// Editor for the image cards shown in the storefront mega-menu, per top-level category.
export function MenuPromosEditor() {
  const t = useTranslations("dashboard.settings.menuPromos")
  const [categories, setCategories] = useState<BackendCategory[]>([])
  const [cards, setCards] = useState<MenuPromoCards>({})
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [lang, setLang] = useState<PromoPopupLocale>("mk")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    Promise.all([apiService.getCategories(), apiService.getMenuPromos()])
      .then(([cats, settings]) => {
        setCategories(cats)
        setUpdatedAt(settings.updatedAt)
        // Start from what the menu shows today: saved cards, else the built-in defaults.
        const initial: MenuPromoCards = {}
        for (const c of cats) initial[c.slug] = settings.cards?.[c.slug] ?? categoryPromos[c.slug] ?? []
        setCards(initial)
        setActiveSlug(cats[0]?.slug ?? null)
      })
      .catch(() => setError(t("errors.loadFailed")))
      .finally(() => setLoading(false))
  }, [t])

  const activeCards = activeSlug ? cards[activeSlug] ?? [] : []

  const updateCard = (index: number, patch: Partial<PromoCard>) => {
    if (!activeSlug) return
    setCards(prev => ({
      ...prev,
      [activeSlug]: prev[activeSlug].map((c, i) => (i === index ? { ...c, ...patch } : c)),
    }))
    setSaved(false)
  }

  const setText = (index: number, field: "title" | "description" | "ctaText", value: string) =>
    updateCard(index, { [field]: { ...activeCards[index][field], [lang]: value } })

  const addCard = () => {
    if (!activeSlug) return
    setCards(prev => ({ ...prev, [activeSlug]: [...(prev[activeSlug] ?? []), emptyCard(activeSlug)] }))
  }

  const removeCard = (index: number) => {
    if (!activeSlug) return
    setCards(prev => ({ ...prev, [activeSlug]: prev[activeSlug].filter((_, i) => i !== index) }))
    setSaved(false)
  }

  const handleImage = async (index: number, file: File | null) => {
    if (!file) return
    setUploadingIndex(index)
    setError(null)
    try {
      updateCard(index, { image: await apiService.uploadMenuPromoImage(file) })
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.uploadFailed"))
    } finally {
      setUploadingIndex(null)
      const input = fileInputs.current[index]
      if (input) input.value = ""
    }
  }

  const handleSave = async () => {
    const missingImage = Object.entries(cards).find(([, list]) => list.some(c => !c.image))
    if (missingImage) {
      setActiveSlug(missingImage[0])
      setError(t("errors.missingImage"))
      return
    }
    setSaving(true)
    setError(null)
    try {
      setUpdatedAt(await apiService.updateMenuPromos(cards, updatedAt))
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
        <LayoutPanelTop className="w-4 h-4 text-teal-600" />
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{t("title")}</h3>
      </div>

      {loading ? (
        <div className="px-6 py-8 text-center text-sm text-gray-400">{t("loading")}</div>
      ) : (
        <div className="px-6 py-4 space-y-4">
          <p className="text-xs text-gray-400 -mt-1">{t("hint")}</p>

          {/* Category */}
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setActiveSlug(c.slug)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  activeSlug === c.slug
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-gray-200 text-gray-600 hover:border-teal-300"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Language of the text fields */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            {PROMO_POPUP_LOCALES.map(l => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  lang === l ? "bg-white text-teal-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {LOCALE_LABELS[l]}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {activeCards.map((card, i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("card", { number: i + 1 })}</span>
                  <button
                    type="button"
                    onClick={() => removeCard(i)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    aria-label={t("removeCard")}
                    title={t("removeCard")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative aspect-[16/9] rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  {card.image ? (
                    <>
                      <Image src={card.image} alt="" fill className="object-cover" sizes="400px" />
                      {/* Preview of how the text sits on the image in the menu */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                        <p className="text-sm font-semibold leading-tight">{card.title[lang] || card.title.mk}</p>
                        <p className="text-xs text-white/75 line-clamp-1">{card.description[lang] || card.description.mk}</p>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                      <ImageOff className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <input
                  ref={el => { fileInputs.current[i] = el }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleImage(i, e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputs.current[i]?.click()}
                  disabled={uploadingIndex !== null}
                  className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:border-teal-400 hover:text-teal-600 transition-colors disabled:opacity-60"
                >
                  {uploadingIndex === i
                    ? <span className="w-3.5 h-3.5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    : <Upload className="w-3.5 h-3.5" />}
                  {uploadingIndex === i ? t("fields.uploading") : card.image ? t("fields.changeImage") : t("fields.uploadImage")}
                </button>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">{t("fields.title")}</label>
                  <Input value={card.title[lang] ?? ""} onChange={e => setText(i, "title", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">{t("fields.description")}</label>
                  <Input value={card.description[lang] ?? ""} onChange={e => setText(i, "description", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">{t("fields.ctaText")}</label>
                    <Input value={card.ctaText[lang] ?? ""} onChange={e => setText(i, "ctaText", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">{t("fields.link")}</label>
                    <Input
                      value={card.ctaSlug}
                      onChange={e => updateCard(i, { ctaSlug: e.target.value })}
                      placeholder="/category/interior-lights"
                    />
                  </div>
                </div>
              </div>
            ))}

            {activeCards.length < MAX_CARDS && (
              <button
                type="button"
                onClick={addCard}
                className="rounded-lg border border-dashed border-gray-300 min-h-40 flex flex-col items-center justify-center gap-2 text-sm text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                {t("addCard")}
              </button>
            )}
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving || uploadingIndex !== null}
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
