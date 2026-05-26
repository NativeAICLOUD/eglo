"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useCart } from "../context/CartContext"
import { formatMKD } from "../../../lib/api"
import { parseMKD } from "../context/CartContext"

export default function CartPage() {
  const { locale } = useParams() as { locale: string }
  const router = useRouter()
  const { items, removeFromCart, updateQuantity, getTotal } = useCart()

  const subtotal = getTotal()
  const FREE_DELIVERY_THRESHOLD = 3990

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Кошничката е празна</h2>
          <p className="text-gray-500 mb-6">Разгледајте ги нашите производи и додајте нешто во кошничката.</p>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Разгледај производи
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb / title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Кошничка</h1>
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <Link href={`/${locale}`} className="hover:text-teal-600 transition-colors">Почетна</Link>
            <span>/</span>
            <span className="text-gray-700">Кошничка</span>
          </div>
        </div>

        {/* Step indicator */}
        <StepIndicator currentStep={1} locale={locale} />

        <div className="mt-6 grid lg:grid-cols-3 gap-6">
          {/* Items table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <div className="col-span-6">Производ</div>
                <div className="col-span-2 text-center">Цена</div>
                <div className="col-span-2 text-center">Количина</div>
                <div className="col-span-2 text-right">Вкупно</div>
              </div>

              {/* Items */}
              {items.map(item => {
                const unitPrice = parseMKD(item.price)
                const rowTotal = unitPrice * item.quantity

                return (
                  <div key={item.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 last:border-0 items-center">
                    {/* Product */}
                    <div className="col-span-12 sm:col-span-6 flex items-center gap-3">
                      <div className="w-16 h-16 relative flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        {item.image && item.image !== "/placeholder.svg" ? (
                          <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</p>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="flex items-center gap-1 mt-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Отстрани
                        </button>
                      </div>
                    </div>

                    {/* Unit price */}
                    <div className="col-span-4 sm:col-span-2 text-sm text-gray-600 text-center">
                      {formatMKD(unitPrice)}
                    </div>

                    {/* Quantity */}
                    <div className="col-span-4 sm:col-span-2 flex items-center justify-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Row total */}
                    <div className="col-span-4 sm:col-span-2 text-sm font-semibold text-gray-900 text-right">
                      {formatMKD(rowTotal)}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 flex justify-between items-center">
              <Link
                href={`/${locale}`}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
              >
                ← Продолжи со купување
              </Link>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-24">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Резиме на нарачката</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Вкупно производи</span>
                  <span className="font-medium">{formatMKD(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Достава</span>
                  <span className="text-gray-500">Пресметана при наплата</span>
                </div>
              </div>

              {subtotal < FREE_DELIVERY_THRESHOLD && (
                <p className="mt-3 text-xs text-teal-700 bg-teal-50 rounded-lg px-3 py-2">
                  Додај уште <strong>{formatMKD(FREE_DELIVERY_THRESHOLD - subtotal)}</strong> за бесплатна достава.
                </p>
              )}

              <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between font-semibold text-base">
                <span>Вкупно</span>
                <span>{formatMKD(subtotal)}</span>
              </div>

              <button
                onClick={() => router.push(`/${locale}/checkout`)}
                className="mt-5 w-full py-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Продолжи кон плаќање
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepIndicator({ currentStep, locale }: { currentStep: number; locale: string }) {
  const steps = [
    { num: 1, label: "Кошничка", href: `/${locale}/cart` },
    { num: 2, label: "Достава", href: null },
    { num: 3, label: "Адреса", href: null },
    { num: 4, label: "Преглед", href: null },
  ]

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center">
          <div className={`flex items-center gap-2 text-sm font-medium ${
            step.num === currentStep ? "text-teal-600" : step.num < currentStep ? "text-gray-400" : "text-gray-400"
          }`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${
              step.num === currentStep
                ? "border-teal-600 bg-teal-600 text-white"
                : step.num < currentStep
                ? "border-gray-300 bg-gray-100 text-gray-400"
                : "border-gray-300 text-gray-400"
            }`}>
              {step.num}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className="w-8 sm:w-16 h-px bg-gray-200 mx-2" />
          )}
        </div>
      ))}
    </div>
  )
}
