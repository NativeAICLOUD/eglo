"use client"

import { useState, useEffect, Fragment } from "react"
import { useTranslations } from "next-intl"
import { Tag, Plus, X, CornerDownRight } from "lucide-react"
import { Button } from "../../../../components/Button"
import { Input } from "../../../../components/Input"
import { apiService, BackendCategory } from "../../../../lib/api"
import { Spinner } from "../../../../components/Spinner"

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", ѓ: "gj", е: "e", ж: "zh", з: "z", ѕ: "dz",
  и: "i", ј: "j", к: "k", л: "l", љ: "lj", м: "m", н: "n", њ: "nj", о: "o", п: "p",
  р: "r", с: "s", т: "t", ќ: "kj", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", џ: "dzh", ш: "sh",
  ë: "e", ç: "c",
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .split("")
    .map(ch => CYRILLIC_TO_LATIN[ch] ?? ch)
    .join("")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function DashboardCategoriesPage() {
  const t = useTranslations("dashboard")
  const [categories, setCategories] = useState<BackendCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  const loadCategories = () =>
    apiService.getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false))

  useEffect(() => {
    loadCategories()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("nav.categories")}</h1>
          <p className="text-gray-500 mt-1 text-sm">{t("categories.subtitle")}</p>
        </div>
        <Button variant="primary" className="flex items-center gap-2" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" />
          {t("categories.addCategory")}
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) :categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mb-4">
              <Tag className="w-7 h-7 text-teal-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">{t("categories.noCategories")}</h3>
            <p className="text-sm text-gray-400">{t("categories.noCategoriesDesc")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["name", "slug", "subcategories"].map(col => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t(`categories.table.${col}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map(cat => (
                  <Fragment key={cat.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-teal-500 flex-shrink-0" />
                        {cat.name}
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{cat.slug}</td>
                      <td className="px-4 py-3 text-gray-500">{cat.subcategories?.length ?? 0}</td>
                    </tr>
                    {cat.subcategories?.map(sub => (
                      <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                        <td className="pl-10 pr-4 py-2.5 text-gray-700 flex items-center gap-2">
                          <CornerDownRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                          {sub.name}
                        </td>
                        <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{sub.slug}</td>
                        <td className="px-4 py-2.5" />
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <AddCategoryModal
          parents={categories}
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false)
            loadCategories()
          }}
        />
      )}
    </div>
  )
}

function AddCategoryModal({
  parents,
  onClose,
  onCreated,
}: {
  parents: BackendCategory[]
  onClose: () => void
  onCreated: () => void
}) {
  const t = useTranslations("dashboard")
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugEdited, setSlugEdited] = useState(false)
  const [parentId, setParentId] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slugEdited) setSlug(slugify(value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) {
      setError(t("categories.add.errors.required"))
      return
    }
    setSaving(true)
    setError(null)
    try {
      const parent = parents.find(p => p.id === parentId)
      await apiService.createCategory({
        name: name.trim(),
        slug: slugify(slug),
        parentId: parentId || null,
        icon: parent?.icon ?? "Lightbulb",
      })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : t("categories.add.errors.saveFailed"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl w-full max-w-md"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{t("categories.addCategory")}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{t("categories.add.name")}</label>
            <Input
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder={t("categories.add.namePlaceholder")}
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{t("categories.add.slug")}</label>
            <Input
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugEdited(true) }}
              placeholder="table-lamps"
              className="font-mono"
            />
            <p className="text-xs text-gray-400">{t("categories.add.slugHint")}</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{t("categories.add.parent")}</label>
            <select
              value={parentId}
              onChange={e => setParentId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">{t("categories.add.parentNone")}</option>
              {parents.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            {t("categories.add.cancel")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? t("categories.add.saving") : t("categories.add.save")}
          </button>
        </div>
      </form>
    </div>
  )
}
