"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Search, Users } from "lucide-react"
import { apiService, DashboardUser, formatMKD } from "../../../../lib/api"

const ROLE_STYLES: Record<string, string> = {
  superadmin: "bg-purple-50 text-purple-700 border-purple-200",
  admin: "bg-teal-50 text-teal-700 border-teal-200",
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default function DashboardUsersPage() {
  const t = useTranslations("dashboard")
  const [users, setUsers] = useState<DashboardUser[] | null>(null)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState("")

  useEffect(() => {
    apiService.getUsers()
      .then(setUsers)
      .catch(() => setError(true))
  }, [])

  const filtered = useMemo(() => {
    if (!users) return []
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(u => (u.email ?? "").toLowerCase().includes(q) || (u.name ?? "").toLowerCase().includes(q))
  }, [users, query])

  const roleBadges = (u: DashboardUser) =>
    u.roles.length === 0 ? (
      <span className="text-xs text-gray-400">—</span>
    ) : (
      u.roles.map(role => (
        <span
          key={role}
          className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border ${ROLE_STYLES[role.toLowerCase()] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}
        >
          {role}
        </span>
      ))
    )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("nav.users")}</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {users ? t("users.count", { count: users.length }) : t("users.subtitle")}
          </p>
        </div>
        {users && users.length > 0 && (
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t("users.search")}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        )}
      </div>

      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{t("users.loadFailed")}</p>
      ) : users === null ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="h-3 bg-gray-200 rounded-full w-48" />
              <div className="h-3 bg-gray-200 rounded-full w-24 ml-auto" />
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-teal-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">{t("users.noUsers")}</h3>
          <p className="text-sm text-gray-400 max-w-xs">{t("users.noUsersDesc")}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Desktop table */}
          <table className="hidden md:table w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left font-medium px-5 py-3">{t("users.columns.user")}</th>
                <th className="text-left font-medium px-5 py-3">{t("users.columns.role")}</th>
                <th className="text-right font-medium px-5 py-3">{t("users.columns.orders")}</th>
                <th className="text-right font-medium px-5 py-3">{t("users.columns.spent")}</th>
                <th className="text-right font-medium px-5 py-3">{t("users.columns.lastOrder")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/60">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{u.name || u.email}</p>
                    {u.name && <p className="text-xs text-gray-500">{u.email}</p>}
                    {u.locked && <p className="text-xs text-red-600 mt-0.5">{t("users.locked")}</p>}
                  </td>
                  <td className="px-5 py-3"><div className="flex flex-wrap gap-1">{roleBadges(u)}</div></td>
                  <td className="px-5 py-3 text-right tabular-nums text-gray-900">{u.orderCount}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-gray-900">{u.orderCount > 0 ? formatMKD(u.totalSpent) : "—"}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-gray-500">{formatDate(u.lastOrderAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <ul className="md:hidden divide-y divide-gray-100">
            {filtered.map(u => (
              <li key={u.id} className="px-4 py-3 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{u.name || u.email}</p>
                    {u.name && <p className="text-xs text-gray-500 truncate">{u.email}</p>}
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">{roleBadges(u)}</div>
                </div>
                <p className="text-xs text-gray-500">
                  {t("users.columns.orders")}: <span className="text-gray-900">{u.orderCount}</span>
                  {u.orderCount > 0 && <> · {formatMKD(u.totalSpent)} · {formatDate(u.lastOrderAt)}</>}
                </p>
                {u.locked && <p className="text-xs text-red-600">{t("users.locked")}</p>}
              </li>
            ))}
          </ul>

          {filtered.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-gray-400">{t("users.noMatches")}</p>
          )}
        </div>
      )}
    </div>
  )
}
