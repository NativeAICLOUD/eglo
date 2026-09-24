"use client"

import { useState, useEffect, use, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Save, Upload, X, ImageOff } from "lucide-react"
import { Button } from "../../../../../../components/Button"
import { Input } from "../../../../../../components/Input"
import { apiService, parseProductName, BackendCategory, BackendProductImage, specTextToJson, specJsonToLines } from "../../../../../../lib/api"
import { Spinner } from "../../../../../../components/Spinner"

const MAX_IMAGES_PER_UPLOAD = 10

function normalizeImages(raw: Array<string | BackendProductImage> | undefined): BackendProductImage[] {
  if (!raw) return []
  return raw.map((img, i) =>
    typeof img === "string" ? { id: `legacy-${i}`, url: img, order: i } : img
  )
}

interface FlatCategory { id: string; name: string; depth: number }

function flattenCategories(cats: BackendCategory[], depth = 0): FlatCategory[] {
  const out: FlatCategory[] = []
  for (const c of cats) {
    out.push({ id: c.id, name: c.name, depth })
    if (c.subcategories?.length) out.push(...flattenCategories(c.subcategories, depth + 1))
  }
  return out
}

// The dropdown is a single flattened list, but the backend's category-assignment
// endpoint needs the (parent category, subcategory) pair — look the parent up by
// searching the original tree for whichever entry the admin picked.
function findCategoryPair(
  cats: BackendCategory[],
  selectedId: string,
  parent?: BackendCategory
): { categoryId: string; subcategoryId: string } | null {
  for (const cat of cats) {
    if (cat.id === selectedId && parent) return { categoryId: parent.id, subcategoryId: cat.id }
    const found = findCategoryPair(cat.subcategories ?? [], selectedId, cat)
    if (found) return found
  }
  return null
}

interface EditPageProps {
  params: Promise<{ id: string }>
}

export default function EditProductPage({ params }: EditPageProps) {
  const { id } = use(params)
  const { locale } = useParams() as { locale: string }
  const router = useRouter()
  const t = useTranslations("dashboard")

  const [loading,    setLoading]    = useState(true)
  const [notFound,   setNotFound]   = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [saveError,  setSaveError]  = useState<string | null>(null)
  const [saved,      setSaved]      = useState(false)

  const [name,        setName]        = useState("")
  const [description, setDescription] = useState("")
  const [price,       setPrice]       = useState("")
  const [discount,    setDiscount]    = useState("")
  const [isNew,       setIsNew]       = useState(false)
  const [initialIsNew, setInitialIsNew] = useState(false)
  const [categoryId,  setCategoryId]  = useState<string>("")
  const [flatCats,    setFlatCats]    = useState<FlatCategory[]>([])
  const [categoriesTree, setCategoriesTree] = useState<BackendCategory[]>([])
  const [specsText,   setSpecsText]   = useState("")

  const [images,        setImages]        = useState<BackendProductImage[]>([])
  const [uploading,     setUploading]     = useState(false)
  const [uploadError,   setUploadError]   = useState<string | null>(null)
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setUploadError(null)

    const files = Array.from(fileList)
    if (files.length > MAX_IMAGES_PER_UPLOAD) {
      setUploadError(t("editProduct.images.tooMany", { max: MAX_IMAGES_PER_UPLOAD }))
      return
    }

    setUploading(true)
    try {
      const uploaded = await apiService.uploadProductImages(id, files)
      setImages(prev => [...prev, ...uploaded])
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t("editProduct.images.uploadFailed"))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    setDeletingImageId(imageId)
    setUploadError(null)
    try {
      await apiService.deleteProductImage(id, imageId)
      setImages(prev => prev.filter(img => img.id !== imageId))
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t("editProduct.images.deleteFailed"))
    } finally {
      setDeletingImageId(null)
    }
  }

  useEffect(() => {
    apiService.getCategories()
      .then(cats => { setCategoriesTree(cats); setFlatCats(flattenCategories(cats)) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    apiService.getProduct(id)
      .then(p => {
        setName(p.title)
        setDescription(p.sku ?? "")
        setPrice(String(p.price))
        setDiscount(p.discountPercentage ? String(p.discountPercentage) : "")
        setIsNew(!!p.isNew)
        setInitialIsNew(!!p.isNew)
        setCategoryId(p.categoryId ?? "")
        // Merge all legacy spec sections into one ordered list of "Key: Value" lines —
        // nothing existing gets lost, it just all lives in one field going forward.
        setSpecsText([
          ...specJsonToLines(p.productDetailsJson),
          ...specJsonToLines(p.dimensionsJson),
          ...specJsonToLines(p.technicalInfoJson),
          ...specJsonToLines(p.otherInfoJson),
        ].join("\n"))
        setImages(normalizeImages(p.images))
      })
      .catch(e => {
        if (e?.status === 404) setNotFound(true)
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim())          { setSaveError(t("editProduct.errors.nameRequired"));  return }
    if (!price || Number(price) <= 0) { setSaveError(t("editProduct.errors.priceRequired")); return }
    if (discount && (Number(discount) < 0 || Number(discount) > 100)) { setSaveError(t("editProduct.errors.discountRange")); return }

    setSaving(true)
    setSaveError(null)
    setSaved(false)

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name:               name.trim(),
          description:        description.trim(),
          price:              parseFloat(price),
          discountPercentage: discount ? parseFloat(discount) : null,
          categoryId:         categoryId || null,
          // All specs now live in one field — the legacy section fields are cleared out
          // since their content was already merged into specsText when the product loaded.
          productDetailsJson: specTextToJson(specsText),
          dimensionsJson:     null,
          technicalInfoJson:  null,
          otherInfoJson:      null,
        }),
      })

      if (res.status === 404) { setSaveError(t("editProduct.errors.notFound")); return }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setSaveError((body as { message?: string }).message ?? t("editProduct.errors.saveFailed"))
        return
      }

      // The main PUT above has no categoryId field on its DTO — category changes
      // only persist through this dedicated endpoint, which needs both the parent
      // category and subcategory, resolved from whichever entry was picked.
      if (categoryId) {
        const pair = findCategoryPair(categoriesTree, categoryId)
        if (pair) {
          const catRes = await fetch(`/api/products/${id}/category`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(pair),
          })
          if (!catRes.ok) {
            setSaveError(t("editProduct.errors.categorySaveFailed"))
            return
          }
        }
      }

      if (isNew !== initialIsNew) {
        try {
          await apiService.setProductsNew([id], isNew)
        } catch {
          setSaveError(t("editProduct.errors.saveFailed"))
          return
        }
      }

      setSaved(true)
      setTimeout(() => router.push(`/${locale}/dashboard/products`), 1000)
    } catch {
      setSaveError(t("editProduct.errors.saveFailed"))
    } finally {
      setSaving(false)
    }
  }

  // ── Loading / not-found states ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="text-center py-32">
        <p className="text-gray-500 mb-4">{t("editProduct.errors.notFound")}</p>
        <Link href={`/${locale}/dashboard/products`}>
          <Button variant="outline">{t("editProduct.backToProducts")}</Button>
        </Link>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-gray-900">{t("editProduct.title")}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{parseProductName(name)}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
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
              value={description}
              onChange={e => setDescription(e.target.value)}
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

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isNew}
              onChange={e => setIsNew(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-blue-600"
            />
            <span>
              <span className="text-sm font-medium text-gray-700">{t("editProduct.fields.isNew")}</span>
              <span className="block text-xs text-gray-400">{t("editProduct.fields.isNewHint")}</span>
            </span>
          </label>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{t("editProduct.fields.category")}</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">{t("editProduct.fields.categoryNone")}</option>
              {flatCats.map(c => (
                <option key={c.id} value={c.id}>
                  {c.depth > 0 ? `${"  ".repeat(c.depth)}↳ ` : ""}{c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">{t("editProduct.images.title")}</h2>
            <span className="text-xs text-gray-400">{t("editProduct.images.count", { count: images.length })}</span>
          </div>

          {images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map(img => (
                <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(img.id)}
                    disabled={deletingImageId === img.id}
                    className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-100"
                    aria-label={t("editProduct.images.delete")}
                  >
                    {deletingImageId === img.id
                      ? <span className="block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <X className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
              <ImageOff className="w-8 h-8" />
              <p className="text-sm">{t("editProduct.images.none")}</p>
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
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-teal-400 hover:text-teal-600 transition-colors disabled:opacity-60"
            >
              {uploading
                ? <span className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                : <Upload className="w-4 h-4" />
              }
              {uploading ? t("editProduct.images.uploading") : t("editProduct.images.upload", { max: MAX_IMAGES_PER_UPLOAD })}
            </button>
            {uploadError && (
              <p className="text-sm text-red-600 mt-2">{uploadError}</p>
            )}
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

        {/* Error / success */}
        {saveError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {saveError}
          </p>
        )}
        {saved && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            {t("editProduct.savedSuccess")}
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
            {saving ? t("editProduct.saving") : t("editProduct.save")}
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
