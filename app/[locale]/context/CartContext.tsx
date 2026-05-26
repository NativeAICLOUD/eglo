"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export interface CartItem {
  id: string
  name: string
  price: string
  quantity: number
  image: string
}

interface CartContextType {
  items: CartItem[]
  addToCart: (item: Omit<CartItem, "quantity">) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  getTotalItems: () => number
  getTotal: () => number
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function parseMKD(price: string): number {
  return parseInt(price.replace(/\s*ден\./, "").replace(/,/g, "").trim(), 10) || 0
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return []
    try { return JSON.parse(localStorage.getItem("eglo_cart") || "[]") } catch { return [] }
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("eglo_cart", JSON.stringify(items))
    }
  }, [items])

  const addToCart = (newItem: Omit<CartItem, "quantity">) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === newItem.id)
      if (existing) return prev.map(i => i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { ...newItem, quantity: 1 }]
    })
  }

  const removeFromCart = (id: string) => setItems(prev => prev.filter(i => i.id !== id))

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(id); return }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i))
  }

  const getTotalItems = () => items.reduce((total, item) => total + item.quantity, 0)

  const getTotal = () => items.reduce((sum, item) => sum + parseMKD(item.price) * item.quantity, 0)

  const clearCart = () => setItems([])

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, getTotalItems, getTotal, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) throw new Error("useCart must be used within a CartProvider")
  return context
}
