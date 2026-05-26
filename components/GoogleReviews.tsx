"use client"

import { Star, ExternalLink } from "lucide-react"

const REVIEWS = [
  {
    name: "Марија Петровска",
    date: "Мај 2025",
    rating: 5,
    text: "Одличен избор на светла и исклучително љубезен персонал. Ги нарачав неколку производи преку интернет и стигнаа брзо и добро спакувани. Дефинитивно ќе купувам повторно!",
    avatar: "М",
  },
  {
    name: "Александар Николовски",
    date: "Април 2025",
    rating: 5,
    text: "Најдобрата продавница за осветлување во Македонија. Огромен избор, квалитетни производи и одлична цена. Персоналот многу стручно ги објасни разликите меѓу производите.",
    avatar: "А",
  },
  {
    name: "Елена Стојановска",
    date: "Март 2025",
    rating: 5,
    text: "Купив неколку светилки за новиот дом и сум презадоволна. Производите се со висок квалитет, точно онака како на фотографиите. Испораката беше навремена.",
    avatar: "Е",
  },
  {
    name: "Бојан Димитриевски",
    date: "Февруари 2025",
    rating: 5,
    text: "Брза испорака, квалитетен производ и одлична комуникација. Ги препорачувам на секој кој бара модерно и квалитетно осветлување по разумна цена.",
    avatar: "Б",
  },
]

const GOOGLE_REVIEWS_URL = "https://www.google.com/search?q=EGLO+Македонија+reviews"

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < count ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  )
}

function GoogleLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" aria-label="Google">
      <path fill="#EA4335" d="M24 9.5c3.1 0 5.9 1.1 8.1 2.9l6-6C34.5 3.1 29.5 1 24 1 14.8 1 7 6.7 3.7 14.7l7 5.4C12.4 13.6 17.7 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.4c-.5 2.8-2.1 5.2-4.5 6.8l7 5.4c4.1-3.8 6.5-9.3 6.5-16.2z"/>
      <path fill="#FBBC05" d="M10.7 28.6A14.7 14.7 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7-5.4A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7-5.4-.9-.7z"/>
      <path fill="#34A853" d="M24 47c5.5 0 10.1-1.8 13.5-4.9l-7-5.4c-1.8 1.2-4 1.9-6.5 1.9-6.3 0-11.6-4.2-13.5-9.9l-7 5.4C7 41.3 14.8 47 24 47z"/>
    </svg>
  )
}

export function GoogleReviews() {
  const overallRating = 4.9
  const totalReviews = 127

  return (
    <section className="py-16 md:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <GoogleLogo />
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Google Reviews
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Нашите клиенти зборуваат
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-3xl font-bold text-gray-900">{overallRating}</span>
              <Stars count={5} />
              <span className="text-sm text-gray-500">({totalReviews} рецензии)</span>
            </div>
          </div>
          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
          >
            Сите рецензии на Google
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Review cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {REVIEWS.map((review, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              {/* Top row */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {review.avatar}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{review.name}</p>
                  <p className="text-xs text-gray-400">{review.date}</p>
                </div>
              </div>

              <Stars count={review.rating} />

              <p className="text-sm text-gray-600 leading-relaxed flex-1">{review.text}</p>

              {/* Google badge */}
              <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-gray-50">
                <GoogleLogo />
                <span className="text-xs text-gray-400">Google</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 text-center">
          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-teal-400 hover:text-teal-600 transition-colors shadow-sm"
          >
            <GoogleLogo />
            Остави рецензија на Google
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  )
}
