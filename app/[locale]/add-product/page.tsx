"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Save, Upload, X, ImageOff } from "lucide-react"
import { Button } from "../../../components/Button"
import { Input } from "../../../components/Input"
import { apiService, BackendCategory, specTextToJson } from "../../../lib/api"

const MAX_IMAGES_PER_UPLOAD = 10

export default function AddProductPage() {
  const router = useRouter()
  const { locale } = useParams() as { locale: string }
  const t = useTranslations("dashboard")

  const [saving,     setSaving]     = useState(false)
  const [saveError,  setSaveError]  = useState<string | null>(null)

  const [name,        setName]        = useState("")
  const [sku,         setSku]         = useState("")
  const [price,       setPrice]       = useState("")
  const [discount,    setDiscount]    = useState("")
  const [categoryId,    setCategoryId]    = useState("")
  const [subcategoryId, setSubcategoryId] = useState("")
  const [specsText,   setSpecsText]   = useState("")

  const [categories, setCategories] = useState<BackendCategory[]>([])
  const [files,     setFiles]     = useState<File[]>([])
  const [previews,  setPreviews]  = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    apiService.getCategories().then(setCategories).catch(() => {})
  }, [])

  // Revoke object URLs on unmount so we don't leak memory.
  useEffect(() => {
    return () => { previews.forEach(p => URL.revokeObjectURL(p)) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedCategory = categories.find(c => c.id === categoryId)
  const subcategories: BackendCategory[] = selectedCategory?.subcategories ?? []

  const handleCategoryChange = (id: string) => {
    setCategoryId(id)
    setSubcategoryId("") // subcategory choices depend on the category — reset on change
  }

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const newFiles = Array.from(fileList).slice(0, MAX_IMAGES_PER_UPLOAD - files.length)
    setFiles(prev => [...prev, ...newFiles])
    setPreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => {
      URL.revokeObjectURL(prev[idx])
      return prev.filter((_, i) => i !== idx)
    })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim())                  { setSaveError(t("editProduct.errors.nameRequired"));  return }
    if (!price || Number(price) <= 0)  { setSaveError(t("editProduct.errors.priceRequired")); return }
    if (discount && (Number(discount) < 0 || Number(discount) > 100)) { setSaveError(t("editProduct.errors.discountRange")); return }
    if (!categoryId || !subcategoryId) { setSaveError(t("addProductPage.errors.categoryRequired")); return }
    if (files.length === 0)            { setSaveError(t("addProductPage.errors.imageRequired")); return }

    setSaving(true)
    setSaveError(null)

    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

    try {
      // Step 1 — create the draft product.
      const createRes = await fetch("/api/products/add", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          name:               name.trim(),
          description:        sku.trim(),
          price:              parseFloat(price),
          discountPercentage: discount ? parseFloat(discount) : null,
          productDetailsJson: specTextToJson(specsText),
        }),
      })
      const createBody = await createRes.json().catch(() => ({}))
      if (!createRes.ok) {
        setSaveError((createBody as { message?: string })?.message || t("addProductPage.errors.createFailed"))
        return
      }
      const productId: string | undefined =
        (createBody as { id?: string; Id?: string })?.id ?? (createBody as { id?: string; Id?: string })?.Id
      if (!productId) {
        setSaveError(t("addProductPage.errors.createFailed"))
        return
      }

      // Step 2 — assign category & subcategory (required before the product can publish).
      const catRes = await fetch(`/api/products/${productId}/category`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ categoryId, subcategoryId }),
      })
      if (!catRes.ok) {
        setSaveError(t("addProductPage.errors.partialCategory"))
        return
      }

      // Step 3 — upload images (also required before the product can publish).
      try {
        await apiService.uploadProductImages(productId, files)
      } catch {
        setSaveError(t("addProductPage.errors.partialImages"))
        return
      }

      // Step 4 — publish so it's visible on the storefront.
      const pubRes = await fetch(`/api/products/${productId}/publish`, {
        method: "POST",
        headers: authHeaders,
      })
      if (!pubRes.ok) {
        setSaveError(t("addProductPage.errors.partialPublish"))
        return
      }

      router.push(`/${locale}/dashboard/products`)
    } catch {
      setSaveError(t("addProductPage.errors.createFailed"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/dashboard/products`}>
          <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("addProductPage.title")}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{t("addProductPage.subtitle")}</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-6">
        {/* Core fields */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800">{t("editProduct.basicInfo")}</h2>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{t("editProduct.fields.name")} *</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="LED-DL SCHWARZ/WEISS 'PALMARES'"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{t("editProduct.fields.sku")}</label>
            <Input
              value={sku}
              onChange={e => setSku(e.target.value)}
              placeholder="33703"
              className="font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{t("editProduct.fields.price")} * (MKD)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="5954.55"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{t("editProduct.fields.discount")} (%)</label>
            <Input
              type="number"
              min="0"
              max="100"
              step="1"
              value={discount}
              onChange={e => setDiscount(e.target.value)}
              placeholder={t("editProduct.fields.discountPlaceholder")}
            />
            <p className="text-xs text-gray-400">{t("editProduct.fields.discountHint")}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">{t("addProductPage.fields.category")}</label>
              <select
                value={categoryId}
                onChange={e => handleCategoryChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">{t("addProductPage.fields.categoryNone")}</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">{t("addProductPage.fields.subcategory")}</label>
              <select
                value={subcategoryId}
                onChange={e => setSubcategoryId(e.target.value)}
                disabled={!categoryId}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">{t("addProductPage.fields.subcategoryNone")}</option>
                {subcategories.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">{t("editProduct.images.title")} *</h2>
            <span className="text-xs text-gray-400">{t("editProduct.images.count", { count: files.length })}</span>
          </div>

          {previews.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {previews.map((preview, idx) => (
                <div key={preview} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <Image src={preview} alt="" fill className="object-cover" sizes="200px" />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label={t("editProduct.images.delete")}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
              <ImageOff className="w-8 h-8" />
              <p className="text-sm">{t("addProductPage.images.none")}</p>
            </div>
          )}

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => handleFilesSelected(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={files.length >= MAX_IMAGES_PER_UPLOAD}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-teal-400 hover:text-teal-600 transition-colors disabled:opacity-60"
            >
              <Upload className="w-4 h-4" />
              {t("editProduct.images.upload", { max: MAX_IMAGES_PER_UPLOAD })}
            </button>
          </div>
        </div>

        {/* Specifications */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-2">
          <h2 className="font-semibold text-gray-800">{t("editProduct.specifications")}</h2>
          <p className="text-xs text-gray-400">{t("editProduct.specificationsHint")}</p>
          <textarea
            value={specsText}
            onChange={e => setSpecsText(e.target.value)}
            rows={10}
            placeholder={t("editProduct.specificationsPlaceholder")}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        {/* Error */}
        {saveError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {saveError}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            variant="primary"
            className="flex items-center gap-2"
            disabled={saving}
          >
            {saving
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Save className="w-4 h-4" />
            }
            {saving ? t("addProductPage.creating") : t("addProductPage.create")}
          </Button>
          <Link href={`/${locale}/dashboard/products`}>
            <Button type="button" variant="outline" disabled={saving}>
              {t("editProduct.cancel")}
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
