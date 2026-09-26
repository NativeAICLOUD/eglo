import { categoryArticles } from "../data/categoryArticles"

interface CategoryArticleProps {
  slug: string
  locale: string
}

// Buying-guide text for a subcategory, shown below its product grid.
// Renders nothing when the subcategory has no article.
export function CategoryArticle({ slug, locale }: CategoryArticleProps) {
  const article = categoryArticles[slug]
  const blocks = article?.[locale as 'mk' | 'sq' | 'en'] ?? article?.en
  if (!blocks || blocks.length === 0) return null

  return (
    <section className="mt-12 md:mt-16 pt-8 md:pt-10 border-t border-gray-200">
      <div className="max-w-3xl text-gray-600 leading-relaxed text-sm md:text-base">
        {blocks.map((block, index) => {
          switch (block.type) {
            case 'h2':
              return <h2 key={index} className="text-xl md:text-2xl font-bold text-gray-900 mt-8 first:mt-0 mb-3">{block.text}</h2>
            case 'h3':
              return <h3 key={index} className="text-lg md:text-xl font-semibold text-gray-900 mt-6 first:mt-0 mb-2">{block.text}</h3>
            case 'h4':
              return <h4 key={index} className="text-base font-semibold text-gray-900 mt-4 mb-1">{block.text}</h4>
            default:
              return <p key={index} className="mb-3">{block.text}</p>
          }
        })}
      </div>
    </section>
  )
}
