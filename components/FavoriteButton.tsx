"use client"

import { Heart } from "lucide-react"
import { useTranslations } from "next-intl"
import { useFavorites, FavoriteItem } from "../app/[locale]/context/FavoritesContext"

interface FavoriteButtonProps {
  product: FavoriteItem
  /** "overlay" sits on a product image; "outline" is a standalone button next to other actions. */
  variant?: "overlay" | "outline"
  className?: string
}

export function FavoriteButton({ product, variant = "overlay", className = "" }: FavoriteButtonProps) {
  const t = useTranslations("favorites")
  const { isFavorite, toggleFavorite } = useFavorites()
  const active = isFavorite(product.id)
  const label = active ? t("remove") : t("add")

  const handleClick = (e: React.MouseEvent) => {
    // The button often sits inside a product <Link>; don't navigate when toggling.
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(product)
  }

  const base = variant === "overlay"
    ? "w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white shadow-sm"
    : "w-12 h-12 rounded-lg border border-gray-300 bg-white hover:border-rose-300"

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center transition-all duration-200 active:scale-90 ${base} ${className}`}
    >
      <Heart
        className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${active ? "fill-rose-500 text-rose-500" : "text-gray-500"}`}
      />
    </button>
  )
}
