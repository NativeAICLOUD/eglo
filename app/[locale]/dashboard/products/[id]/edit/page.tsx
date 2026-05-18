"use client"

import { useState, useEffect, use } from "react"
import { useRouter, useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { ArrowLeft, ChevronDown, ChevronUp, Save } from "lucide-react"
import { Button } from "../../../../../../components/Button"
import { Input } from "../../../../../../components/Input"
import { apiService, parseProductName, BackendCategory } from "../../../../../../lib/api"
import { Spinner } from "../../../../../../components/Spinner"

interface FlatCategory { id: string; name: string; depth: number }

function flattenCategories(cats: BackendCategory[], depth = 0): FlatCategory[] {
  const out: FlatCategory[] = []
  for (const c of cats) {
    out.push({ id: c.id, name: c.name, depth })
    if (c.subcategories?.length) out.push(...flattenCategories(c.subcategories, depth + 1))
  }
  return out
}

interface JsonField { key: string; value: string }

function parseJsonFields(raw: string | null | undefined): JsonField[] {
  if (!raw) return []
  try {
    const obj = JSON.parse(raw)
    if (typeof obj !== "object" || obj === null) return []
    return Object.entries(obj).map(([key, value]) => ({ key, value: String(value) }))
  } catch { return [] }
}

function fieldsToJson(fields: JsonField[]): string | null {
  const filled = fields.filter(f => f.key.trim() && f.value.trim())
  if (filled.length === 0) return null
  return JSON.stringify(Object.fromEntries(filled.map(f => [f.key.trim(), f.value.trim()])))
}

function JsonSection({
  title, fields, onChange,
}: {
  title: string
  fields: JsonField[]
  onChange: (fields: JsonField[]) => void
}) {
  const [open, setOpen] = useState(false)

  const update = (i: number, part: Partial<JsonField>) => {
    const next = [...fields]
    next[i] = { ...next[i], ...part }
    onChange(next)
  }
  const add    = () => onChange([...fields, { key: "", value: "" }])
  const remove = (i: number) => onChange(fields.filter((_, idx) => idx !== i))

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-sm font-medium text-gray-700">{title}</span>
        <div className="flex items-center gap-2">
          {fields.filter(f => f.key.trim()).length > 0 && (
            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
              {fields.filter(f => f.key.trim()).length}
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 py-3 space-y-2">
          {fields.map((f, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="Key"
                value={f.key}
                onChange={e => update(i, { key: e.target.value })}
                className="flex-1 text-sm"
              />
              <Input
                placeholder="Value"
                value={f.value}
                onChange={e => update(i, { value: e.target.value })}
                className="flex-1 text-sm"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-gray-400 hover:text-red-500 px-1 text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={add}
            className="text-sm text-teal-600 hover:text-teal-700 font-medium"
          >
            + Add field
          </button>
        </div>
      )}
    </div>
  )
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
  const [categoryId,  setCategoryId]  = useState<string>("")
  const [flatCats,    setFlatCats]    = useState<FlatCategory[]>([])
  const [details,     setDetails]     = useState<JsonField[]>([])
  const [dimensions,  setDimensions]  = useState<JsonField[]>([])
  const [technical,   setTechnical]   = useState<JsonField[]>([])
  const [other,       setOther]       = useState<JsonField[]>([])

  useEffect(() => {
    apiService.getCategories()
      .then(cats => setFlatCats(flattenCategories(cats)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    apiService.getProduct(id)
      .then(p => {
        setName(p.title)
        setDescription(p.sku ?? "")
        setPrice(String(p.price))
        setCategoryId(p.categoryId ?? "")
        setDetails(parseJsonFields(p.productDetailsJson))
        setDimensions(parseJsonFields(p.dimensionsJson))
        setTechnical(parseJsonFields(p.technicalInfoJson))
        setOther(parseJsonFields(p.otherInfoJson))
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
          categoryId:         categoryId || null,
          productDetailsJson: fieldsToJson(details),
          dimensionsJson:     fieldsToJson(dimensions),
          technicalInfoJson:  fieldsToJson(technical),
          otherInfoJson:      fieldsToJson(other),
        }),
      })

      if (res.status === 404) { setSaveError(t("editProduct.errors.notFound")); return }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setSaveError((body as { message?: string }).message ?? t("editProduct.errors.saveFailed"))
        return
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

        {/* JSON spec sections */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
          <h2 className="font-semibold text-gray-800">{t("editProduct.specifications")}</h2>
          <JsonSection title={t("editProduct.fields.productDetails")} fields={details}    onChange={setDetails}    />
          <JsonSection title={t("editProduct.fields.dimensions")}     fields={dimensions} onChange={setDimensions} />
          <JsonSection title={t("editProduct.fields.technicalInfo")}  fields={technical}  onChange={setTechnical}  />
          <JsonSection title={t("editProduct.fields.otherInfo")}      fields={other}      onChange={setOther}      />
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
