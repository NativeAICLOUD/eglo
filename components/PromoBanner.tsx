"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function PromoBanner() {
  const t = useTranslations("header.topBar")
  const messages = t.raw("promos") as string[]

  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(true)

  const DISPLAY_MS = 4000
  const FADE_MS = 400

  const goTo = (index: number) => {
    setVisible(false)
    setTimeout(() => {
      setCurrent(index)
      setVisible(true)
    }, FADE_MS)
  }

  const prev = () => goTo((current - 1 + messages.length) % messages.length)
  const next = () => goTo((current + 1) % messages.length)

  // Auto-advance
  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrent(i => (i + 1) % messages.length)
        setVisible(true)
      }, FADE_MS)
    }, DISPLAY_MS)
    return () => clearInterval(timer)
  }, [messages.length])

  return (
    <div className="flex items-center justify-center gap-2 select-none">
      <button
        onClick={prev}
        aria-label="Previous promotion"
        className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      <span
        className="text-center transition-all duration-400 min-w-0"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(4px)",
          transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
        }}
      >
        {messages[current]}
      </span>

      <button
        onClick={next}
        aria-label="Next promotion"
        className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
