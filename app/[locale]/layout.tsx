import type { Metadata } from 'next';
import '../../styles/globals.css';
import { ConditionalLayout } from '../../components/ConditionalLayout';
import { CartProvider } from './context/CartContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { locales } from '../../i18n';
import LocaleLayoutProvider from '../../components/providers/LocaleLayoutProvider';
import { notFound } from 'next/navigation';
import { getMessages as getLocaleMessages } from '../../lib/getMessages';
import type { Locale } from '../../i18n';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'EGLO',
  description: 'EGLO | Feels like home',
  icons: {
    icon: '/assets/images/icon.png?v=1',
    shortcut: '/assets/images/icon.png?v=1',
    apple: '/assets/images/icon.png?v=1'
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function Layout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Pull messages for the current locale (important for SSG)
  let messages;
  try {
    messages = await getLocaleMessages(locale as Locale);
  } catch {
    notFound();
  }

  return (
    <LocaleLayoutProvider locale={locale} messages={messages}>
      <CartProvider>
        <FavoritesProvider>
          <ConditionalLayout>{children}</ConditionalLayout>
        </FavoritesProvider>
      </CartProvider>
    </LocaleLayoutProvider>
  );
}
