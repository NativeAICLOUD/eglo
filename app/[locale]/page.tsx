import { HeroSection } from "../../components/HeroSection"
import { CategoryGrid } from "../../components/CategoryGrid"
import { FeaturedProducts } from "../../components/FeaturedProducts"
import { CTASection } from "../../components/CtaSection"
import { StyleGrid } from "../../components/StyleGrid"
import { GoogleReviews } from "../../components/GoogleReviews"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <CategoryGrid />
      <StyleGrid />
      <FeaturedProducts />
      <GoogleReviews />
      <CTASection />
    </div>
  )
}
