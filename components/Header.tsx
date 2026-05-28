"use client";
import Link from "next/link";
import Image from "next/image";
import { MapPin, User, ShoppingCart, LogOut, Menu, LayoutDashboard, Settings, Package } from "lucide-react";
import { Button } from "./Button";
import LocaleSwitcher from "./LanguageSwitcher";
import { PromoBanner } from "./PromoBanner";
import { Badge } from "./Badge";
import { Navigation } from "./Navigation";
import { SearchBar } from "./SearchBar";
import { useState, useRef, useEffect } from "react";
import { useCart } from "../app/[locale]/context/CartContext";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useAuth } from "../lib/useAuth";

interface HeaderProps {
  noPadding?: boolean;
}

export function Header({ noPadding = false }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { getTotalItems } = useCart();
  const cartItemCount = getTotalItems();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("header");
  const { user, isAuthenticated, logout } = useAuth();

  const isAdmin = !!user?.roles?.some(r => ["superadmin", "admin"].includes(r.toLowerCase()));
  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`.trim()
    : user?.email ?? "";

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Hide top bar after 80px down, restore only when back above 20px —
    // prevents the header height change from re-triggering the scroll handler.
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(prev => (prev ? y > 20 : y > 80));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 transition-shadow duration-300" style={{ boxShadow: scrolled ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>
      {/* Top Bar */}
      <div className={`bg-white px-4 overflow-hidden transition-all duration-300 ${scrolled ? 'max-h-0 py-0' : 'max-h-16 py-2'}`}>
        <div className="max-w-7xl mx-auto grid grid-cols-3 items-center text-[13px] font-normal text-slate-600">
          {/* Left — store & support links */}
          <div className="flex items-center gap-3">
            <a
              href="https://www.google.com/maps?gs_lcrp=EgZjaHJvbWUqCAgBEAAYFhgeMgYIABBFGDkyCAgBEAAYFhgeMg0IAhAAGIsDGIAEGKIEMg0IAxAAGIsDGIAEGKIEMgoIBBAAGIsDGO8FMgoIBRAAGIsDGO8FMgoIBhAAGIsDGO8F0gEINjE3NWoxajeoAgCwAgA&um=1&ie=UTF-8&fb=1&gl=mk&sa=X&geocode=Ke9lSzamFVQTMWF7CnsiBhyj&daddr=Ul.+Mesta+br.16,+Skopje+1000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-teal-600 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{t("topBar.findStore")}</span>
            </a>
            <span className="text-slate-300 hidden md:inline">|</span>
            <span className="hidden md:inline">{t("topBar.customerSupport")}</span>
          </div>

          {/* Center — animated promo banner */}
          <div className="hidden sm:flex justify-center overflow-hidden">
            <PromoBanner />
          </div>

          {/* Right — locale switcher */}
          <div className="flex justify-end">
            <LocaleSwitcher />
          </div>
        </div>
      </div>

      {/* Thin separator between top bar and main header */}
      <div className={`border-t border-gray-100 transition-all duration-300 ${scrolled ? 'hidden' : ''}`} />

      {/* Main Header */}
      <div className={`transition-all duration-300 ${scrolled ? "py-2" : "py-4"} ${noPadding ? "px-0" : "px-4"}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 mr-2 rounded hover:bg-gray-100"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            {/* Logo */}
            <Link href={`/${locale}`} className="flex items-center">
              <Image
                src="/assets/images/Logo_EGLO.png"
                alt="EGLO"
                width={120}
                height={40}
                className={`w-auto transition-all duration-300 ${scrolled ? "h-6" : "h-8"}`}
              />
            </Link>

            {/* Desktop Search Bar */}
            <SearchBar />

            {/* User Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              {isAuthenticated ? (
                // Authenticated — dropdown menu
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(o => !o)}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {(displayName[0] ?? "U").toUpperCase()}
                    </div>
                    <span className="hidden lg:inline text-sm text-gray-700 max-w-[140px] truncate">
                      {displayName}
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                      {/* Email label */}
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>

                      {/* Dashboard — admin only */}
                      {isAdmin && (
                        <Link
                          href={`/${locale}/dashboard`}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-teal-700 font-medium hover:bg-teal-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                          {t("actions.userMenu.dashboard")}
                        </Link>
                      )}

                      <Link
                        href={`/${locale}/profile`}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-4 h-4 flex-shrink-0" />
                        {t("actions.userMenu.profile")}
                      </Link>

                      <Link
                        href={`/${locale}/my-products`}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Package className="w-4 h-4 flex-shrink-0" />
                        {t("actions.userMenu.myProducts")}
                      </Link>

                      <Link
                        href={`/${locale}/settings`}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-4 h-4 flex-shrink-0" />
                        {t("actions.userMenu.settings")}
                      </Link>

                      <div className="border-t border-gray-100 mt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4 flex-shrink-0" />
                          {t("actions.userMenu.logout")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // User is not logged in - show login button
                <Link href={`/${locale}/login`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 md:gap-2 p-2 md:p-3 hover:text-teal-600 transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span className="hidden lg:inline">{t("actions.login")}</span>
                  </Button>
                </Link>
              )}

              <Link href={`/${locale}/cart`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 md:gap-2 p-2 md:p-3 relative"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="hidden lg:inline">{t("actions.cart")}</span>
                  {cartItemCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-1 -right-1 md:static md:ml-1 bg-teal-600 text-white"
                    >
                      {cartItemCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="sm:hidden mt-3 px-1">
            <SearchBar mobile />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <Navigation
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
    </header>
  );
}
