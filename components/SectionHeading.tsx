import type { ReactNode } from "react"

interface SectionHeadingProps {
  title: string
  subtitle?: string
  children?: ReactNode
}

// Shared home-page section heading: centred, uppercase, muted gray.
export function SectionHeading({ title, subtitle, children }: SectionHeadingProps) {
  return (
    <div className="text-center mb-8 md:mb-10">
      <h2 className="text-[1.625rem] sm:text-[2rem] lg:text-[2.5rem] leading-tight font-extrabold uppercase tracking-[0.03em] text-[#5f6670] break-words">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-base md:text-lg text-gray-500 font-light max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  )
}
