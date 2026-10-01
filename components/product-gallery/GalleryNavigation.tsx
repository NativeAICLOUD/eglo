import { ChevronLeft, ChevronRight } from "lucide-react"

interface GalleryNavigationProps {
  onPrevious: () => void
  onNext: () => void
}

// Circular previous / next buttons centred on the left and right edges. Hidden on
// phones, where swiping is the navigation gesture.
export function GalleryNavigation({ onPrevious, onNext }: GalleryNavigationProps) {
  const button =
    "absolute top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-white border border-gray-100 shadow-[0_2px_10px_rgba(15,23,42,0.08)] text-teal-600 transition-all duration-200 hover:shadow-[0_4px_16px_rgba(15,23,42,0.12)] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
  return (
    <>
      <button type="button" onClick={onPrevious} aria-label="Previous image" className={`${button} left-5 lg:left-8`}>
        <ChevronLeft className="w-7 h-7 lg:w-8 lg:h-8" strokeWidth={1.25} />
      </button>
      <button type="button" onClick={onNext} aria-label="Next image" className={`${button} right-5 lg:right-8`}>
        <ChevronRight className="w-7 h-7 lg:w-8 lg:h-8" strokeWidth={1.25} />
      </button>
    </>
  )
}
