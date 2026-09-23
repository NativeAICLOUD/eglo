"use client"

import { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Header } from "./Header"
import { Footer } from "./Footer"
import { PromoPopup } from "./PromoPopup"

interface EgloDefaultLayoutProps {
  children: ReactNode
  noPadding?: boolean
}

export function EgloDefaultLayout({ children, noPadding = false }: EgloDefaultLayoutProps) {
  const pathname = usePathname()
  
  // Override noPadding for product and category pages
  const shouldHaveNoPadding = noPadding || pathname.startsWith('/product/') || pathname.startsWith('/category/')
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header noPadding={shouldHaveNoPadding} />
      <main className={`flex-1 ${shouldHaveNoPadding ? 'p-0' : 'px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8'}`}>
        {shouldHaveNoPadding ? (
          <div className="max-w-7xl mx-auto">
            {/* Debug indicator */}
            {/* <h1 className="text-2xl font-bold mb-4 text-center">
              {shouldHaveNoPadding ? 'noPadding is true' : 'noPadding is false'}
            </h1> */}
            {children}
          </div>
        ) : (
          <>
            {/* Debug indicator */}
            {/* <h1 className="text-2xl font-bold mb-4 text-center">
              {shouldHaveNoPadding ? 'noPadding is true' : 'noPadding is false'}
            </h1> */}
            {children}
          </>
        )}
      </main>
      <Footer noPadding={shouldHaveNoPadding} />
      <PromoPopup />
    </div>
  )
} 