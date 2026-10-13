// The six interior styles in the home page "Discover Styles & Trends" grid, in display order.
// Photos are EGLO's own trend and style imagery from eglo.com (Trends 2026 and Stile pages).
// Each card opens the search page filtered by an EGLO product-title keyword that fits the
// style — the style names never appear in product titles, so searching them finds nothing.

export interface StyleTrend {
  /** Translation key under `stylesAndTrends.styles`, also the `?style=` value on the search page. */
  id: string
  image: string
  /** CSS object-position that keeps the lamp in frame when the photo is cropped to the card. */
  objectPosition: string
  /** EGLO product-title keyword the card searches for. */
  searchTerm: string
}

export const STYLE_TRENDS: StyleTrend[] = [
  {
    id: "pureSerenity",
    image: "/assets/images/styles-trends/pure-serenity.webp",
    objectPosition: "20% 50%",
    searchTerm: "SAND",     // sand and taupe shades and bases
  },
  {
    id: "asianAesthetic",
    image: "/assets/images/styles-trends/asian-aesthetic.webp",
    objectPosition: "50% 30%",
    searchTerm: "BAMBUS",   // bamboo pendants, table and floor lamps
  },
  {
    id: "modernMinimalism",
    image: "/assets/images/styles-trends/modern-minimalism.webp",
    objectPosition: "50% 20%",
    searchTerm: "LED-HL",   // integrated-LED pendants
  },
  {
    id: "industrialStyle",
    image: "/assets/images/styles-trends/industrial-style.webp",
    objectPosition: "15% 50%",
    searchTerm: "KUPFER",   // black-and-copper metal pendants
  },
  {
    id: "nature",
    image: "/assets/images/styles-trends/nature.webp",
    objectPosition: "30% 50%",
    searchTerm: "NATUR",    // natural linen, rattan and wood finishes
  },
  {
    id: "scandinavianStyle",
    image: "/assets/images/styles-trends/scandinavian-style.webp",
    objectPosition: "50% 50%",
    searchTerm: "HOLZ",     // wood
  },
]

export const STYLE_TREND_IDS = STYLE_TRENDS.map((s) => s.id)
