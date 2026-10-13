import { HeroSection } from "../../components/HeroSection"
import { TrustStrip } from "../../components/TrustStrip"
import { CategoryGrid } from "../../components/CategoryGrid"
import { FeaturedProducts } from "../../components/FeaturedProducts"
import { CTASection } from "../../components/CtaSection"
import { StyleGrid } from "../../components/StyleGrid"
import { TrendingIdeas } from "../../components/TrendingIdeasSection"
import { StylesAndTrends } from "../../components/StylesAndTrends"
import { GoogleReviews } from "../../components/GoogleReviews"
import { BestSellersSection } from "../../components/BestSellersSection"
import { API_BASE_URL } from "../../lib/api"

/**
 * Banner image chosen in the dashboard, read on the server so the page never flashes the
 * built-in one first. Re-checked every minute; any failure falls back to the built-in banner.
 */
async function getHeroImage(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/hero`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(3000) })
    if (!res.ok) return null
    const data = await res.json() as { imageUrl?: string | null }
    return data.imageUrl ?? null
  } catch {
    return null
  }
}

export default async function HomePage() {
  const heroImage = await getHeroImage()
  return (
    <div className="min-h-screen bg-white">
      <HeroSection imageUrl={heroImage} />
      <TrustStrip />
      <CategoryGrid />
      <StyleGrid />
      <BestSellersSection />
      <FeaturedProducts />
      <TrendingIdeas />
      <StylesAndTrends />
      <CTASection />
      <GoogleReviews />
    </div>
  )
}
