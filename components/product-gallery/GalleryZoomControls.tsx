import { Minus, Plus } from "lucide-react"

interface GalleryZoomControlsProps {
  canZoomIn: boolean
  canZoomOut: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  className?: string
}

// Minimal stacked + / − controls: thin strokes, no visible button box.
export function GalleryZoomControls({ canZoomIn, canZoomOut, onZoomIn, onZoomOut, className = "" }: GalleryZoomControlsProps) {
  const button =
    "w-11 h-11 flex items-center justify-center text-gray-500 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-default transition-colors rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <button type="button" onClick={onZoomIn} disabled={!canZoomIn} aria-label="Zoom in" className={button}>
        <Plus className="w-7 h-7" strokeWidth={1.25} />
      </button>
      <button type="button" onClick={onZoomOut} disabled={!canZoomOut} aria-label="Zoom out" className={button}>
        <Minus className="w-7 h-7" strokeWidth={1.25} />
      </button>
    </div>
  )
}
