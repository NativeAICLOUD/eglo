"use client"

import { Truck, ShieldCheck, RefreshCw, Headphones } from "lucide-react"

const items = [
  {
    icon: Truck,
    title: "Бесплатна достава",
    desc: "За нарачки над 5.000 ден.",
  },
  {
    icon: ShieldCheck,
    title: "2 години гаранција",
    desc: "На сите EGLO производи",
  },
  {
    icon: RefreshCw,
    title: "Лесно враќање",
    desc: "30 дена без прашања",
  },
  {
    icon: Headphones,
    title: "Стручна поддршка",
    desc: "Достапни секој работен ден",
  },
]

export function TrustStrip() {
  return (
    <div className="bg-gray-50 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
          {items.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3 px-4 py-5 md:py-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
                <Icon className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 leading-tight">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-tight">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
