"use client"

import { useEffect } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

const STORAGE_KEY = "eglo:productSaved"

type SavedKind = "created" | "updated"

/** Called by the dashboard right before it redirects to the product page. */
export function markProductSaved(productId: string, kind: SavedKind) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ id: productId, kind }))
  } catch {
    // Storage unavailable (private mode etc.) — the redirect still works, just no popup.
  }
}

// Success toast on the product page after an admin adds or edits the product.
// Shown once: the note left by the dashboard is removed as soon as it is read.
export function ProductSavedToast({ productId }: { productId: string }) {
  const t = useTranslations("productPage.savedToast")

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const note = JSON.parse(raw) as { id?: string; kind?: SavedKind }
      if (note.id !== productId) return
      sessionStorage.removeItem(STORAGE_KEY)
      const kind: SavedKind = note.kind === "updated" ? "updated" : "created"
      toast.success(t(`${kind}.title`), { description: t(`${kind}.text`) })
    } catch {
      // Ignore unreadable storage.
    }
  }, [productId, t])

  return null
}
