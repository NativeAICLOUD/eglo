"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ShoppingCart, ChevronDown, ChevronUp, Truck, Store, RefreshCw, Trash2, Eye, ImageOff } from "lucide-react"
import { useTranslations } from "next-intl"

interface OrderItem {
  productId: string
  productName: string
  sku?: string | null
  articleNumber?: string | null
  imageUrl?: string | null
  variant?: string | null
  quantity: number
  unitPrice: number
  lineTotal: number
  productExists?: boolean
}

interface Order {
  id: string
  customerEmail: string
  customerName: string
  phone?: string | null
  address?: string | null
  city?: string | null
  postalCode?: string | null
  deliveryMethod: string
  paymentMethod?: string | null
  status: string
  subtotal?: number
  deliveryCost?: number
  totalAmount: number
  createdAt: string
  items: OrderItem[]
}

function ItemImage({ src, alt }: { src?: string | null; alt: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="w-14 h-14 rounded-lg bg-white border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
      {src && !failed
        ? <img src={src} alt={alt} className="w-full h-full object-contain" onError={() => setFailed(true)} />
        : <ImageOff className="w-5 h-5 text-gray-300" />}
    </div>
  )
}

const STATUS_STYLES: Record<string, string> = {
  Pending:    "bg-amber-100 text-amber-700",
  Processing: "bg-blue-100 text-blue-700",
  Shipped:    "bg-purple-100 text-purple-700",
  Delivered:  "bg-teal-100 text-teal-700",
  Cancelled:  "bg-red-100 text-red-700",
}

const STATUS_OPTIONS = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]

function formatMKD(n: number) {
  return `${Math.round(n).toLocaleString("mk-MK")} ден.`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("mk-MK", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function DashboardOrdersPage() {
  const t = useTranslations("dashboard.orders")
  const { locale } = useParams() as { locale: string }
  const [orders, setOrders]   = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      const res = await fetch("/api/orders", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.status === 401) throw new Error(t("sessionExpired"))
      if (!res.ok) throw new Error(t("errorStatus", { status: res.status }))
      setOrders(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorLoading"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [])

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id)

  const updateStatus = async (orderId: string, newStatus: string) => {
    const previousOrders = orders
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    setUpdatingId(orderId)
    setStatusError(null)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error(t("errorStatus", { status: res.status }))
    } catch (e) {
      setOrders(previousOrders)
      setStatusError(e instanceof Error ? e.message : t("statusUpdateError"))
    } finally {
      setUpdatingId(null)
    }
  }

  const toggleSelected = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const allSelected = orders.length > 0 && orders.every(o => selected.has(o.id))
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(orders.map(o => o.id)))
  const selectCancelled = () => setSelected(new Set(orders.filter(o => o.status === "Cancelled").map(o => o.id)))

  const deleteOrders = async (ids: string[]) => {
    setDeleting(true)
    setStatusError(null)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      const res = await fetch("/api/orders/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ids }),
      })
      if (res.status === 401) throw new Error(t("sessionExpired"))
      if (res.status === 403) throw new Error(t("delete.forbidden"))
      if (!res.ok) throw new Error(t("errorStatus", { status: res.status }))
      setOrders(prev => prev.filter(o => !ids.includes(o.id)))
      setSelected(prev => new Set([...prev].filter(id => !ids.includes(id))))
      if (expanded && ids.includes(expanded)) setExpanded(null)
    } catch (e) {
      setStatusError(e instanceof Error ? e.message : t("delete.error"))
    } finally {
      setDeleting(false)
      setConfirmDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-500 mt-1 text-sm">{t("subtitle")}</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> {t("refresh")}
        </button>
      </div>

      {statusError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center justify-between">
          <span>{statusError}</span>
          <button onClick={() => setStatusError(null)} className="text-red-400 hover:text-red-600 text-xs font-medium">
            ✕
          </button>
        </div>
      )}

      {/* Stats strip */}
      {!loading && orders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: t("stats.totalOrders"), value: orders.length },
            { label: t("stats.processing"),  value: orders.filter(o => o.status === "Pending").length },
            { label: t("stats.shipped"),     value: orders.filter(o => o.status === "Shipped" || o.status === "Delivered").length },
            { label: t("stats.revenue"),     value: formatMKD(orders.reduce((s, o) => s + o.totalAmount, 0)) },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm py-16 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-sm text-red-700">{error}</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mb-4">
            <ShoppingCart className="w-7 h-7 text-teal-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">{t("noOrders")}</h3>
          <p className="text-sm text-gray-400 max-w-xs">{t("noOrdersDesc")}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Selection toolbar */}
          <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-gray-100">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 accent-teal-600" />
              {t("delete.selectAll")}
            </label>
            <button
              onClick={selectCancelled}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              {t("delete.selectCancelled")}
            </button>
            {selected.size > 0 && (
              <button
                onClick={() => setConfirmDelete([...selected])}
                disabled={deleting}
                className="ml-auto flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-60"
              >
                <Trash2 className="w-4 h-4" />
                {t("delete.deleteSelected", { count: selected.size })}
              </button>
            )}
          </div>

          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <div className="col-span-3">{t("table.customer")}</div>
            <div className="col-span-2">{t("table.date")}</div>
            <div className="col-span-2">{t("table.delivery")}</div>
            <div className="col-span-2 text-right">{t("table.total")}</div>
            <div className="col-span-2 text-center">{t("table.status")}</div>
            <div className="col-span-1" />
          </div>

          {orders.map(order => (
            <div key={order.id} className="border-b border-gray-100 last:border-0">
              {/* Row */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggle(order.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(order.id) } }}
                className="w-full text-left grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center cursor-pointer"
              >
                {/* Customer */}
                <div className="col-span-10 md:col-span-3 flex items-start gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={selected.has(order.id)}
                    onChange={() => toggleSelected(order.id)}
                    onClick={e => e.stopPropagation()}
                    className="mt-0.5 w-4 h-4 accent-teal-600 flex-shrink-0"
                    aria-label={t("delete.select")}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {order.customerName || order.customerEmail}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{order.customerEmail}</p>
                    <p className="text-xs text-gray-400 font-mono md:hidden">{order.id.slice(0, 8)}…</p>
                  </div>
                </div>

                {/* Date */}
                <div className="hidden md:block col-span-2 text-sm text-gray-600">
                  {formatDate(order.createdAt)}
                </div>

                {/* Delivery */}
                <div className="hidden md:flex col-span-2 items-center gap-1.5 text-sm text-gray-600">
                  {order.deliveryMethod === "Courier"
                    ? <Truck className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    : <Store className="w-4 h-4 text-teal-500 flex-shrink-0" />}
                  <span>{order.deliveryMethod === "Courier" ? t("delivery.courier") : t("delivery.store")}</span>
                </div>

                {/* Total */}
                <div className="hidden md:block col-span-2 text-sm font-semibold text-gray-900 text-right">
                  {formatMKD(order.totalAmount)}
                </div>

                {/* Status */}
                <div className="hidden md:flex col-span-2 justify-center" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer disabled:opacity-50 ${STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Expand icon */}
                <div className="col-span-2 md:col-span-1 flex justify-end">
                  {expanded === order.id
                    ? <ChevronUp className="w-4 h-4 text-gray-400" />
                    : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === order.id && (
                <div className="px-6 pb-5 border-t border-gray-100 bg-gray-50">
                  <div className="grid sm:grid-cols-2 gap-6 pt-4">
                    {/* Order info */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{t("detail.orderDetails")}</p>
                      <div className="space-y-1 text-sm text-gray-700">
                        <p><span className="text-gray-400">{t("detail.id")} </span><span className="font-mono text-xs break-all">{order.id}</span></p>
                        <p><span className="text-gray-400">{t("detail.date")} </span>{formatDate(order.createdAt)}</p>
                        <p><span className="text-gray-400">{t("detail.delivery")} </span>
                          {order.deliveryMethod === "Courier" ? t("delivery.courierFull") : t("delivery.pickupFull")}
                        </p>
                        <p><span className="text-gray-400">{t("detail.payment")} </span>
                          {order.paymentMethod === "CashOnDelivery" || order.paymentMethod === "PayInStore"
                            ? t(`detail.paymentMethods.${order.paymentMethod}`)
                            : order.paymentMethod || t("detail.notProvided")}
                        </p>
                        <p className="flex items-center gap-2"><span className="text-gray-400">{t("detail.status")} </span>
                          <select
                            value={order.status}
                            disabled={updatingId === order.id}
                            onChange={(e) => updateStatus(order.id, e.target.value)}
                            className={`px-2 py-0.5 rounded-full text-xs font-medium border-0 cursor-pointer disabled:opacity-50 ${STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-600"}`}
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </p>
                      </div>
                      <button
                        onClick={() => setConfirmDelete([order.id])}
                        disabled={deleting}
                        className="mt-4 flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t("delete.deleteOrder")}
                      </button>
                    </div>

                    {/* Customer */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{t("detail.customer")}</p>
                      <div className="space-y-1 text-sm text-gray-700 break-words">
                        {([
                          ["detail.name",       order.customerName],
                          ["detail.email",      order.customerEmail],
                          ["detail.phone",      order.phone],
                          ["detail.address",    order.address],
                          ["detail.city",       order.city],
                          ["detail.postalCode", order.postalCode],
                        ] as const).map(([label, value]) => (
                          <p key={label}>
                            <span className="text-gray-400">{t(label)} </span>
                            {value || <span className="text-gray-400">{t("detail.notProvided")}</span>}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Products */}
                  <div className="mt-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{t("detail.products", { count: order.items.length })}</p>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <div className="col-span-5">{t("detail.product")}</div>
                        <div className="col-span-2">{t("detail.sku")}</div>
                        <div className="col-span-1 text-center">{t("detail.qty")}</div>
                        <div className="col-span-2 text-right">{t("detail.unitPrice")}</div>
                        <div className="col-span-2 text-right">{t("detail.lineTotal")}</div>
                      </div>
                      {order.items.map((item, i) => {
                        const code = item.sku || item.articleNumber
                        return (
                          <div key={i} className="grid grid-cols-12 gap-x-4 gap-y-2 px-4 py-3 border-b border-gray-100 last:border-0 items-center text-sm">
                            <div className="col-span-12 md:col-span-5 flex items-start gap-3 min-w-0">
                              <ItemImage src={item.imageUrl} alt={item.productName} />
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 break-words">{item.productName}</p>
                                {item.variant && (
                                  <p className="text-xs text-gray-500 mt-0.5">{t("detail.variant")} {item.variant}</p>
                                )}
                                {item.productExists === false ? (
                                  <p className="text-xs text-gray-400 mt-1">{t("detail.productRemoved")}</p>
                                ) : (
                                  <a
                                    href={`/${locale}/product/${item.productId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> {t("detail.viewProduct")}
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="col-span-12 md:col-span-2 text-gray-700">
                              <span className="md:hidden text-gray-400">{t("detail.sku")}: </span>
                              <span className="font-mono text-xs">{code || t("detail.notProvided")}</span>
                            </div>
                            <div className="col-span-4 md:col-span-1 md:text-center text-gray-700">
                              <span className="md:hidden text-gray-400">{t("detail.qty")}: </span>{item.quantity}
                            </div>
                            <div className="col-span-4 md:col-span-2 text-right text-gray-700">
                              <span className="md:hidden text-gray-400 block text-xs">{t("detail.unitPrice")}</span>
                              {formatMKD(item.unitPrice)}
                            </div>
                            <div className="col-span-4 md:col-span-2 text-right font-semibold text-gray-900">
                              <span className="md:hidden text-gray-400 block text-xs font-normal">{t("detail.lineTotal")}</span>
                              {formatMKD(item.lineTotal ?? item.unitPrice * item.quantity)}
                            </div>
                          </div>
                        )
                      })}
                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm space-y-1">
                        {order.subtotal != null && order.subtotal > 0 && (
                          <div className="flex justify-between text-gray-600">
                            <span>{t("detail.subtotal")}</span>
                            <span>{formatMKD(order.subtotal)}</span>
                          </div>
                        )}
                        {order.deliveryCost != null && order.subtotal != null && order.subtotal > 0 && (
                          <div className="flex justify-between text-gray-600">
                            <span>{t("detail.deliveryCost")}</span>
                            <span>{formatMKD(order.deliveryCost)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold">
                          <span>{t("detail.total")}</span>
                          <span className="text-teal-600">{formatMKD(order.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => !deleting && setConfirmDelete(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              {t("delete.confirmTitle", { count: confirmDelete.length })}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{t("delete.confirmText")}</p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                {t("delete.cancel")}
              </button>
              <button
                onClick={() => deleteOrders(confirmDelete)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-60"
              >
                {deleting ? t("delete.deleting") : t("delete.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
