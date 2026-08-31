import type { Metadata } from 'next'
import { DashboardShell } from '../../../components/DashboardShell'
import DashboardLocaleProvider from '../../../components/providers/DashboardLocaleProvider'

export const metadata: Metadata = {
  title: 'Admin Dashboard - EGLO',
  description: 'EGLO Admin Dashboard',
  icons: {
    icon: '/assets/images/icon.png?v=1',
    shortcut: '/assets/images/icon.png?v=1',
    apple: '/assets/images/icon.png?v=1',
  },
}

// Admin dashboard is an internal tool — defaults to English regardless of
// which locale (mk/sq/en) the URL was visited under, but admins can switch
// to Macedonian or Albanian from within the dashboard (see DashboardShell).
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLocaleProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardLocaleProvider>
  )
}
