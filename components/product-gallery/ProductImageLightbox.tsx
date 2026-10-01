"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { versionedImageSrc } from "../../lib/api"
import { GalleryZoomControls } from "./GalleryZoomControls"
import { GalleryNavigation } from "./GalleryNavigation"
import { ProductGalleryThumbnails } from "./ProductGalleryThumbnails"
import { ProductImageViewer, PanPosition, clampZoom, MAX_ZOOM, MIN_ZOOM } from "./ProductImageViewer"

const ZOOM_STEP = 0.75
const NO_PAN: PanPosition = { x: 0, y: 0 }

interface ProductImageLightboxProps {
  /** Original catalog image URLs, in gallery order. */
  images: string[]
  alt: string
  open: boolean
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  onClose: () => void
}

// Full-screen white product image viewer: large centred original image, zoom controls
// top-left, close top-right, circular previous/next on the sides and a thumbnail strip
// along the bottom. Locks page scroll, traps focus and restores it on close.
export function ProductImageLightbox({ images, alt, open, activeIndex, onActiveIndexChange, onClose }: ProductImageLightboxProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [zoom, setZoom] = useState(MIN_ZOOM)
  const [pan, setPan] = useState<PanPosition>(NO_PAN)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => setMounted(true), [])

  const count = images.length
  const go = useCallback(
    (delta: number) => onActiveIndexChange((activeIndex + delta + count) % count),
    [activeIndex, count, onActiveIndexChange]
  )

  // A new image always starts unzoomed.
  useEffect(() => {
    setZoom(MIN_ZOOM)
    setPan(NO_PAN)
  }, [activeIndex])

  // Scales the current pan with the zoom so the same spot stays under the view centre.
  const zoomBy = useCallback((delta: number) => {
    const next = clampZoom(zoom + delta)
    setZoom(next)
    setPan(p => (next <= MIN_ZOOM ? NO_PAN : { x: (p.x * next) / zoom, y: (p.y * next) / zoom }))
  }, [zoom])

  // Opening: fade in, lock page scroll, move focus inside; closing restores both.
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeRef.current?.focus()
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => {
      cancelAnimationFrame(frame)
      setVisible(false)
      document.body.style.overflow = previousOverflow
      opener?.focus?.()
    }
  }, [open])

  // Keyboard: Escape closes, arrows navigate (wrapping), +/- zoom, Tab stays inside.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      } else if (e.key === "ArrowLeft" && count > 1) {
        go(-1)
      } else if (e.key === "ArrowRight" && count > 1) {
        go(1)
      } else if (e.key === "+" || e.key === "=") {
        zoomBy(ZOOM_STEP)
      } else if (e.key === "-") {
        zoomBy(-ZOOM_STEP)
      } else if (e.key === "Tab" && dialogRef.current) {
        const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled])")]
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, count, go, zoomBy, onClose])

  // Preload the neighbouring originals so previous / next appear instantly.
  useEffect(() => {
    if (!open || count < 2) return
    for (const i of [(activeIndex + 1) % count, (activeIndex - 1 + count) % count]) {
      const img = new window.Image()
      img.src = versionedImageSrc(images[i])
    }
  }, [open, activeIndex, count, images])

  if (!mounted || !open || count === 0) return null

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Product image gallery"
      className={`fixed inset-0 z-[100] w-screen h-[100dvh] bg-white flex flex-col transition-opacity duration-200 ease-out ${visible ? "opacity-100" : "opacity-0"}`}
    >
      {/* overflow-hidden here (not on the image area) lets a zoomed image use the whole viewer. */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        {/* Generous white space around the image; extra side room for the arrows on larger screens. */}
        <div className="absolute inset-0 px-3 pt-16 pb-4 sm:px-28 sm:pt-12 sm:pb-8 lg:px-36">
          <ProductImageViewer
            src={versionedImageSrc(images[activeIndex])}
            alt={`${alt} ${activeIndex + 1}`}
            zoom={zoom}
            pan={pan}
            onZoomChange={setZoom}
            onPanChange={setPan}
            onSwipe={dir => count > 1 && go(dir)}
          />
        </div>

        <GalleryZoomControls
          className="absolute top-2 left-2 sm:top-6 sm:left-6"
          canZoomIn={zoom < MAX_ZOOM}
          canZoomOut={zoom > MIN_ZOOM}
          onZoomIn={() => zoomBy(ZOOM_STEP)}
          onZoomOut={() => zoomBy(-ZOOM_STEP)}
        />

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close gallery"
          className="absolute top-2 right-2 sm:top-5 sm:right-6 w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
        >
          <X className="w-7 h-7 sm:w-9 sm:h-9" strokeWidth={1.25} />
        </button>

        {count > 1 && <GalleryNavigation onPrevious={() => go(-1)} onNext={() => go(1)} />}
      </div>

      {count > 1 && (
        <ProductGalleryThumbnails images={images} activeIndex={activeIndex} alt={alt} onSelect={onActiveIndexChange} />
      )}
    </div>,
    document.body
  )
}
