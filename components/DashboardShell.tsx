"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  BarChart3, Package, Tag, ShoppingCart, Users, Settings,
  Home, LogOut, Menu, X,
} from "lucide-react"
import { useAuth } from "../lib/useAuth"
import { useTranslations } from "next-intl"

const NAV_ITEMS = [
  { key: "overview",    href: "",            icon: BarChart3     },
  { key: "products",    href: "/products",   icon: Package       },
  { key: "categories",  href: "/categories", icon: Tag           },
  { key: "orders",      href: "/orders",     icon: ShoppingCart  },
  { key: "users",       href: "/users",      icon: Users         },
  { key: "settings",    href: "/settings",   icon: Settings      },
]

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const params    = useParams()
  const router    = useRouter()
  const locale    = params.locale as string
  const { user, isAuthenticated, initialized, logout } = useAuth()
  const t         = useTranslations("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Auth guard — only runs after token check is fully complete
  useEffect(() => {
    if (!initialized) return
    if (!isAuthenticated) { router.replace(`/${locale}/login`); return }
    const isAdmin = user?.roles?.some(r => ["superadmin", "admin"].includes(r.toLowerCase()))
    if (!isAdmin) router.replace(`/${locale}`)
  }, [initialized, isAuthenticated, user, locale, router])

  // Show spinner until auth is resolved — never redirect prematurely
  if (!initialized || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const basePath = `/${locale}/dashboard`

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-white border-r border-gray-200 w-64">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <Link href={`/${locale}/dashboard`} onClick={() => setSidebarOpen(false)}>
          <Image src="/assets/images/Logo_EGLO.png" alt="EGLO" width={100} height={32} style={{ height: "auto" }} />
        </Link>
        <button className="md:hidden p-1" onClick={() => setSidebarOpen(false)}>
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV_ITEMS.map(({ key, href, icon: Icon }) => {
          const to      = `${basePath}${href}`
          const isActive = href === ""
            ? pathname === basePath
            : pathname.startsWith(to)
          return (
            <Link key={key} href={to} onClick={() => setSidebarOpen(false)}>
              <span className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? "bg-teal-50 text-teal-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                {t(`nav.${key}`)}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3 space-y-1">
        <Link href={`/${locale}`} onClick={() => setSidebarOpen(false)}>
          <span className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <Home className="w-5 h-5" />
            {t("nav.viewSite")}
          </span>
        </Link>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          {t("nav.logout")}
        </button>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="w-64 flex flex-col fixed inset-y-0">
          <Sidebar />
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 h-full">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200">
          <button onClick={() => setSidebarOpen(true)} className="p-1">
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <Image src="/assets/images/Logo_EGLO.png" alt="EGLO" width={80} height={26} style={{ height: "auto" }} />
          <span className="text-sm text-gray-500 truncate max-w-[120px]">{user?.email}</span>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
