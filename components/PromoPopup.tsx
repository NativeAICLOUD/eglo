"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { X } from "lucide-react"
import { apiService, PromoPopupSettings } from "../lib/api"

const SHOW_DELAY_MS = 1200

// Dismissal is remembered per popup *content* (not just "ever dismissed"), so
// changing the promo in the dashboard shows it again even to returning visitors.
function dismissalKey(popup: PromoPopupSettings): string {
  return `promoPopupDismissed:${popup.title}|${popup.text}|${popup.ctaLink ?? ""}`
}

export function PromoPopup() {
  const pathname = usePathname()
  const [popup, setPopup] = useState<PromoPopupSettings | null>(null)
  const [visible, setVisible] = useState(false)

  // Never interrupt an active checkout/cart flow.
  const suppressed = /\/(cart|checkout)(\/|$)/.test(pathname)

  useEffect(() => {
    if (suppressed) return
    let cancelled = false
    apiService.getPromoPopup()
      .then(settings => {
        if (cancelled || !settings.enabled) return
        if (!settings.title.trim() && !settings.text.trim()) return
        if (typeof window !== "undefined" && sessionStorage.getItem(dismissalKey(settings))) return
        setPopup(settings)
        setTimeout(() => { if (!cancelled) setVisible(true) }, SHOW_DELAY_MS)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [suppressed])

  const dismiss = () => {
    if (popup) sessionStorage.setItem(dismissalKey(popup), "1")
    setVisible(false)
  }

  if (!popup || !visible) return null

  const isExternal = /^https?:\/\//.test(popup.ctaLink ?? "")

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
      onClick={dismiss}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {popup.imageUrl && (
          <div className="relative w-full aspect-[4/3] bg-gray-100">
            <Image src={popup.imageUrl} alt="" fill className="object-cover" sizes="400px" />
          </div>
        )}

        <div className="p-6 text-center space-y-2">
          {popup.title && <h2 className="text-xl font-bold text-gray-900">{popup.title}</h2>}
          {popup.text && <p className="text-sm text-gray-600 leading-relaxed">{popup.text}</p>}

          {popup.ctaText && popup.ctaLink && (
            isExternal ? (
              <a
                href={popup.ctaLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={dismiss}
                className="inline-block mt-3 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {popup.ctaText}
              </a>
            ) : (
              <Link
                href={popup.ctaLink}
                onClick={dismiss}
                className="inline-block mt-3 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {popup.ctaText}
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  )
}
