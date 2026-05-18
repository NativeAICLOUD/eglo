import type { Metadata } from 'next'
import { DashboardShell } from '../../../components/DashboardShell'

export const metadata: Metadata = {
  title: 'Admin Dashboard - EGLO',
  description: 'EGLO Admin Dashboard',
  icons: {
    icon: '/assets/images/icon.png?v=1',
    shortcut: '/assets/images/icon.png?v=1',
    apple: '/assets/images/icon.png?v=1',
  },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
} 