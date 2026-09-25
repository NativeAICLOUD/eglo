"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

/** Snapshot of a product at the moment it was saved, enough to render a card offline. */
export interface FavoriteItem {
  id: string
  name: string
  sku: string
  price: number
  discountPercentage?: number | null
  imageUrl?: string | null
}

interface FavoritesContextType {
  items: FavoriteItem[]
  isFavorite: (id: string) => boolean
  toggleFavorite: (item: FavoriteItem) => void
  removeFavorite: (id: string) => void
}

const STORAGE_KEY = "eglo_favorites"

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<FavoriteItem[]>(() => {
    if (typeof window === "undefined") return []
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") } catch { return [] }
  })

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
  }, [items])

  const isFavorite = (id: string) => items.some(i => i.id === id)

  const toggleFavorite = (item: FavoriteItem) =>
    setItems(prev => prev.some(i => i.id === item.id) ? prev.filter(i => i.id !== item.id) : [item, ...prev])

  const removeFavorite = (id: string) => setItems(prev => prev.filter(i => i.id !== id))

  return (
    <FavoritesContext.Provider value={{ items, isFavorite, toggleFavorite, removeFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) throw new Error("useFavorites must be used within a FavoritesProvider")
  return context
}
