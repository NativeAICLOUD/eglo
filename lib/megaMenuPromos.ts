// Promo cards shown in the right column of the mega-menu, keyed by category slug.
// Slugs must match what GET /api/categories returns in the `slug` field.
// TODO: replace with a fetch from a featured_collections table once available.

export interface PromoCard {
  image: string
  title: Record<string, string>        // locale → text, e.g. { mk: '...', sq: '...' }
  description: Record<string, string>
  ctaText: Record<string, string>
  ctaSlug: string                      // relative path after /{locale}, e.g. '/category/interior-lights'
}

/**
 * Display order of subcategory slugs per top-level category slug.
 * Slugs not listed appear at the end in API order.
 * Matches the official EGLO website priority.
 */
export const subcategoryOrder: Record<string, string[]> = {
  'interior-lights': [
    'smart-lighting',
    'led-lamps',
    'ceiling-lights',
    'floor-lamps',
    'pendant-lights',
    'chandeliers',
    'wall-lamps',
    'table-lamps',
    'track-spotlights',
    'recessed-surface',
    'under-cabinet',
  ],
  'outdoor-lights': [
    'garden-lights',
    'facade-lights',
    'pathway-lights',
    'outdoor-led-lights',
    'solar-lights',
    'outdoor-wall-lights',
    'exterior-ceiling-lights',
    'outdoor-spotlights',
    'earth-luminaires',
    'motion-detectors',
    'house-number-lighting',
    'pedestal-lights',
    'smart-outdoor-lighting',
  ],
}

export const categoryPromos: Record<string, [PromoCard, PromoCard]> = {
  'interior-lights': [
    {
      image: '/assets/images/interior-lights1.jpg',
      title:       { mk: 'Модерно осветлување', sq: 'Ndriçim modern' },
      description: { mk: 'Откријте ја нашата колекција за ентериер', sq: 'Zbuloni koleksionin tonë të brendshëm' },
      ctaText:     { mk: 'Прегледај', sq: 'Shiko' },
      ctaSlug: '/category/interior-lights',
    },
    {
      image: '/assets/images/smart-lighting.jpg',
      title:       { mk: 'Паметно осветлување', sq: 'Ndriçim inteligjent' },
      description: { mk: 'Контролирај го домот со EGLO connect', sq: 'Kontrollo shtëpinë me EGLO connect' },
      ctaText:     { mk: 'Погледни', sq: 'Shiko' },
      ctaSlug: '/category/interior-lights',
    },
  ],
  'outdoor-lights': [
    {
      image: '/assets/images/outdoor-lights1.png',
      title:       { mk: 'Надворешно осветлување', sq: 'Ndriçim i jashtëm' },
      description: { mk: 'Осветлете го вашиот двор и градина', sq: 'Ndriçoni kopshtin dhe oborrin tuaj' },
      ctaText:     { mk: 'Прегледај', sq: 'Shiko' },
      ctaSlug: '/category/outdoor-lights',
    },
    {
      image: '/assets/images/outdoor-inspiration.jpg',
      title:       { mk: 'Инспирација за надвор', sq: 'Inspirim për jashtë' },
      description: { mk: 'Стилски дизајн за секоја сезона', sq: 'Dizajn elegant për çdo stinë' },
      ctaText:     { mk: 'Погледни', sq: 'Shiko' },
      ctaSlug: '/category/outdoor-lights',
    },
  ],
  'ceiling-fans': [
    {
      image: '/assets/images/ceilingFan.jpg',
      title:       { mk: 'Тавански вентилатори', sq: 'Ventilatorë tavanier' },
      description: { mk: 'Комфор и стил за секоја просторија', sq: 'Rehati dhe stil për çdo dhomë' },
      ctaText:     { mk: 'Прегледај', sq: 'Shiko' },
      ctaSlug: '/category/ceiling-fans',
    },
    {
      image: '/assets/images/industrial-ceiling-fan.webp',
      title:       { mk: 'Индустриски вентилатори', sq: 'Ventilatorë industrialë' },
      description: { mk: 'Моќен воздушен проток со модерен дизајн', sq: 'Rrjedhë e fuqishme ajri me dizajn modern' },
      ctaText:     { mk: 'Погледни', sq: 'Shiko' },
      ctaSlug: '/category/ceiling-fans',
    },
  ],
  'illuminants': [
    {
      image: '/assets/images/bulbs1.jpg',
      title:       { mk: 'LED Сијалици', sq: 'Llamba LED' },
      description: { mk: 'Енергетски ефикасни сијалици за секоја намена', sq: 'Llamba efikase energjetikisht për çdo qëllim' },
      ctaText:     { mk: 'Прегледај', sq: 'Shiko' },
      ctaSlug: '/category/illuminants',
    },
    {
      image: '/assets/images/bulbs2.jpg',
      title:       { mk: 'Специјални жарулки', sq: 'Llamba speciale' },
      description: { mk: 'Пронајдете ја совршената сијалица', sq: 'Gjeni llambën e përsosur' },
      ctaText:     { mk: 'Погледни', sq: 'Shiko' },
      ctaSlug: '/category/illuminants',
    },
  ],
}
