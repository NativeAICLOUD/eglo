"use client"

import { useEffect, useRef } from "react"
import { trimmedImageSrc } from "../../lib/api"

interface ProductGalleryThumbnailsProps {
  images: string[]
  activeIndex: number
  alt: string
  onSelect: (index: number) => void
}

// Filmstrip along the bottom of the viewer. Scrolls horizontally when there are many
// images and keeps the active thumbnail in view.
export function ProductGalleryThumbnails({ images, activeIndex, alt, onSelect }: ProductGalleryThumbnailsProps) {
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    itemRefs.current[activeIndex]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
  }, [activeIndex])

  return (
    <div className="flex-shrink-0 h-24 sm:h-[120px] bg-white border-t border-gray-200">
      <div className="h-full overflow-x-auto overscroll-x-contain" style={{ scrollbarWidth: "thin" }}>
        <div className="flex items-center gap-2.5 sm:gap-3 h-full w-max mx-auto px-4 sm:px-6">
          {images.map((src, i) => {
            const active = i === activeIndex
            return (
              <button
                key={`${src}-${i}`}
                ref={el => { itemRefs.current[i] = el }}
                type="button"
                onClick={() => onSelect(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={active ? "true" : undefined}
                className={`flex-shrink-0 w-[84px] h-[68px] sm:w-[100px] sm:h-[82px] rounded-lg bg-white overflow-hidden border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 ${
                  active ? "border-teal-600 ring-1 ring-teal-600" : "border-gray-200 hover:border-gray-400"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={trimmedImageSrc(src, 200)}
                  alt={`${alt} ${i + 1}`}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="w-full h-full object-contain p-1.5"
                />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
