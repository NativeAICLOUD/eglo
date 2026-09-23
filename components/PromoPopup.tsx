"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useLocale } from "next-intl"
import Image from "next/image"
import Link from "next/link"
import { X } from "lucide-react"
import { apiService, PromoPopupContent, PROMO_POPUP_LOCALES, PromoPopupLocale } from "../lib/api"

const SHOW_DELAY_MS = 1200

interface DisplayedPopup extends PromoPopupContent {
  imageUrl?: string | null
  ctaLink?: string | null
}

// Dismissal is remembered per popup *content* (not just "ever dismissed"), so
// changing anything in the dashboard — including the image — shows it again.
function dismissalKey(popup: DisplayedPopup): string {
  return `promoPopupDismissed:${popup.title}|${popup.text}|${popup.ctaText ?? ""}|${popup.ctaLink ?? ""}|${popup.imageUrl ?? ""}`
}

function hasContent(c: PromoPopupContent | undefined): c is PromoPopupContent {
  return !!c && (!!c.title.trim() || !!c.text.trim())
}

// Links are authored with a locale prefix (e.g. /mk/category/...); point them at
// the visitor's current locale instead.
function localizeLink(link: string | null | undefined, locale: string): string | null | undefined {
  if (!link) return link
  return link.replace(new RegExp(`^/(${PROMO_POPUP_LOCALES.join("|")})(?=/|$)`), `/${locale}`)
}

export function PromoPopup() {
  const pathname = usePathname()
  const locale = useLocale()
  const [popup, setPopup] = useState<DisplayedPopup | null>(null)
  const [visible, setVisible] = useState(false)

  // Never interrupt an active checkout/cart flow.
  const suppressed = /\/(cart|checkout)(\/|$)/.test(pathname)

  useEffect(() => {
    if (suppressed) return
    let cancelled = false
    apiService.getPromoPopup()
      .then(settings => {
        if (cancelled || !settings.enabled) return
        // Visitor's language first, then Macedonian, then whatever has content.
        const order = [locale as PromoPopupLocale, "mk" as const, ...PROMO_POPUP_LOCALES]
        const content = order.map(l => settings.translations[l]).find(hasContent)
        if (!content) return
        const displayed: DisplayedPopup = {
          ...content,
          imageUrl: settings.imageUrl,
          ctaLink: localizeLink(settings.ctaLink, locale),
        }
        if (typeof window !== "undefined" && sessionStorage.getItem(dismissalKey(displayed))) return
        setPopup(displayed)
        setTimeout(() => { if (!cancelled) setVisible(true) }, SHOW_DELAY_MS)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [suppressed, locale])

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
