"use client"

import { useRef, useState } from "react"

export const MIN_ZOOM = 1
export const MAX_ZOOM = 4
const DOUBLE_TAP_ZOOM = 2.5
const SWIPE_THRESHOLD = 50

export interface PanPosition {
  x: number
  y: number
}

export const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))

interface ProductImageViewerProps {
  src: string
  alt: string
  zoom: number
  pan: PanPosition
  onZoomChange: (zoom: number) => void
  onPanChange: (pan: PanPosition) => void
  /** Horizontal swipe at 1× zoom: -1 = previous, 1 = next. */
  onSwipe: (direction: -1 | 1) => void
}

type Point = { x: number; y: number }
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

// The large centred image. One set of pointer handlers covers mouse and touch:
// drag pans when zoomed, two fingers pinch-zoom, a horizontal swipe at 1× changes
// image, and double-click / double-tap toggles zoom.
export function ProductImageViewer({ src, alt, zoom, pan, onZoomChange, onPanChange, onSwipe }: ProductImageViewerProps) {
  const areaRef = useRef<HTMLDivElement>(null)
  const pointers = useRef(new Map<number, Point>())
  const gesture = useRef<{ start: Point; pan: PanPosition; pinchDistance?: number; pinchZoom?: number } | null>(null)
  const [interacting, setInteracting] = useState(false)
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)

  // Keeps the zoomed image covering the viewing area — it can't be dragged off-screen.
  const clampPan = (p: PanPosition, z: number): PanPosition => {
    const rect = areaRef.current?.getBoundingClientRect()
    if (!rect || z <= 1) return { x: 0, y: 0 }
    const maxX = (rect.width * (z - 1)) / 2
    const maxY = (rect.height * (z - 1)) / 2
    return { x: Math.max(-maxX, Math.min(maxX, p.x)), y: Math.max(-maxY, Math.min(maxY, p.y)) }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const [a, b] = [...pointers.current.values()]
    gesture.current = b
      ? { start: a, pan, pinchDistance: distance(a, b), pinchZoom: zoom }
      : { start: a, pan }
    setInteracting(true)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const [a, b] = [...pointers.current.values()]
    const g = gesture.current
    if (b && g.pinchDistance && g.pinchZoom) {
      const z = clampZoom((g.pinchZoom * distance(a, b)) / g.pinchDistance)
      onZoomChange(z)
      onPanChange(clampPan(pan, z))
    } else if (zoom > 1) {
      onPanChange(clampPan({ x: g.pan.x + a.x - g.start.x, y: g.pan.y + a.y - g.start.y }, zoom))
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    const g = gesture.current
    const wasSingle = pointers.current.size === 1
    pointers.current.delete(e.pointerId)
    if (g && wasSingle && zoom <= 1 && !g.pinchDistance) {
      const dx = e.clientX - g.start.x
      const dy = e.clientY - g.start.y
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) onSwipe(dx < 0 ? 1 : -1)
    }
    if (pointers.current.size === 0) {
      gesture.current = null
      setInteracting(false)
    } else {
      // One finger lifted mid-pinch: continue as a pan from here.
      const [remaining] = [...pointers.current.values()]
      gesture.current = { start: remaining, pan }
    }
  }

  const onDoubleClick = () => {
    if (zoom > 1) {
      onZoomChange(1)
      onPanChange({ x: 0, y: 0 })
    } else {
      onZoomChange(DOUBLE_TAP_ZOOM)
    }
  }

  const cursor = zoom > 1 ? (interacting ? "grabbing" : "grab") : "zoom-in"

  return (
    <div
      ref={areaRef}
      className="relative w-full h-full select-none"
      style={{ touchAction: "none", cursor }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt={alt}
        draggable={false}
        onLoad={() => setLoadedSrc(src)}
        className={`w-full h-full object-contain ${loadedSrc === src ? "opacity-100" : "opacity-0"}`}
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          transition: interacting ? "opacity 200ms" : "opacity 200ms, transform 250ms ease-out",
          willChange: "transform",
        }}
      />
    </div>
  )
}
