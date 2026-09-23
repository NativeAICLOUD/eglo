"use client"

import { Truck, ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"

const items = [
  { icon: Truck, key: "freeDelivery" },
  { icon: ShieldCheck, key: "warranty" },
] as const

export function TrustStrip() {
  const t = useTranslations("trustStrip")

  return (
    <div className="border-b border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-2 divide-x divide-gray-100">
          {items.map(({ icon: Icon, key }) => (
            <div key={key} className="flex items-center justify-center gap-3 px-4 py-6 md:py-7">
              <Icon className="w-5 h-5 text-teal-600 flex-shrink-0" strokeWidth={1.5} />
              <p className="text-sm font-medium text-gray-800 leading-tight tracking-tight">{t(key)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
