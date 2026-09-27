import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface ImageLinkCardProps {
  href: string
  image: string
  title: string
  description: string
  cta: string
  alt?: string
}

// Large image card with title, two-line description and a text CTA. Shared by the
// home category and style grids so both sections have identical proportions.
export function ImageLinkCard({ href, image, title, description, cta, alt }: ImageLinkCardProps) {
  return (
    <Link href={href} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-gray-100 aspect-[4/3] sm:aspect-[4/5]">
        <Image
          src={image || "/placeholder.svg"}
          alt={alt ?? title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      </div>
      <div className="pt-4 md:pt-5">
        <h3 className="text-lg md:text-xl font-medium tracking-tight text-gray-900">{title}</h3>
        {/* Reserve two lines so the CTAs line up across cards whatever the description length. */}
        <p className="mt-1.5 text-[15px] leading-6 text-gray-500 line-clamp-2 min-h-12">{description}</p>
        <span className="mt-4 inline-flex items-center gap-2 pb-0.5 border-b border-teal-700/25 text-sm font-medium text-teal-700 transition-colors duration-300 group-hover:border-teal-700">
          {cta}
          <ArrowRight className="w-4 h-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  )
}
