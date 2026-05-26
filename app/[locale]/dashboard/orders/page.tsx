"use client"

import { useEffect, useState } from "react"
import { ShoppingCart, ChevronDown, ChevronUp, Truck, Store, RefreshCw } from "lucide-react"

interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

interface Order {
  id: string
  customerEmail: string
  customerName: string
  deliveryMethod: string
  status: string
  totalAmount: number
  createdAt: string
  items: OrderItem[]
}

const STATUS_STYLES: Record<string, string> = {
  Pending:    "bg-amber-100 text-amber-700",
  Processing: "bg-blue-100 text-blue-700",
  Shipped:    "bg-purple-100 text-purple-700",
  Delivered:  "bg-teal-100 text-teal-700",
  Cancelled:  "bg-red-100 text-red-700",
}

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
  const [orders, setOrders]   = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      const res = await fetch("/api/orders", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setOrders(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при вчитување")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [])

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Нарачки</h1>
          <p className="text-gray-500 mt-1 text-sm">Управувај со нарачките на клиентите</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Освежи
        </button>
      </div>

      {/* Stats strip */}
      {!loading && orders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Вкупно нарачки", value: orders.length },
            { label: "Во обработка",  value: orders.filter(o => o.status === "Pending").length },
            { label: "Испратени",     value: orders.filter(o => o.status === "Shipped" || o.status === "Delivered").length },
            { label: "Вкупен приход", value: formatMKD(orders.reduce((s, o) => s + o.totalAmount, 0)) },
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
          <h3 className="text-base font-semibold text-gray-900 mb-1">Нема нарачки</h3>
          <p className="text-sm text-gray-400 max-w-xs">Нарачките ќе се прикажат овде кога клиентите ќе купат.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <div className="col-span-3">Клиент</div>
            <div className="col-span-2">Датум</div>
            <div className="col-span-2">Достава</div>
            <div className="col-span-2 text-right">Вкупно</div>
            <div className="col-span-2 text-center">Статус</div>
            <div className="col-span-1" />
          </div>

          {orders.map(order => (
            <div key={order.id} className="border-b border-gray-100 last:border-0">
              {/* Row */}
              <button
                onClick={() => toggle(order.id)}
                className="w-full text-left grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center"
              >
                {/* Customer */}
                <div className="col-span-10 md:col-span-3">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {order.customerName || order.customerEmail}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{order.customerEmail}</p>
                  <p className="text-xs text-gray-400 font-mono md:hidden">{order.id.slice(0, 8)}…</p>
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
                  <span>{order.deliveryMethod === "Courier" ? "Курир" : "Продавница"}</span>
                </div>

                {/* Total */}
                <div className="hidden md:block col-span-2 text-sm font-semibold text-gray-900 text-right">
                  {formatMKD(order.totalAmount)}
                </div>

                {/* Status */}
                <div className="hidden md:flex col-span-2 justify-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {order.status}
                  </span>
                </div>

                {/* Expand icon */}
                <div className="col-span-2 md:col-span-1 flex justify-end">
                  {expanded === order.id
                    ? <ChevronUp className="w-4 h-4 text-gray-400" />
                    : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {/* Expanded detail */}
              {expanded === order.id && (
                <div className="px-6 pb-5 border-t border-gray-100 bg-gray-50">
                  <div className="grid sm:grid-cols-2 gap-6 pt-4">
                    {/* Order info */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Детали за нарачката</p>
                      <div className="space-y-1 text-sm text-gray-700">
                        <p><span className="text-gray-400">ID: </span><span className="font-mono text-xs">{order.id}</span></p>
                        <p><span className="text-gray-400">Датум: </span>{formatDate(order.createdAt)}</p>
                        <p><span className="text-gray-400">Достава: </span>
                          {order.deliveryMethod === "Courier" ? "Inn Post Radeski (Курир)" : "Преземање во продавница"}
                        </p>
                        <p><span className="text-gray-400">Статус: </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                            {order.status}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Items */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Производи ({order.items.length})</p>
                      <div className="space-y-1.5">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-700 truncate max-w-[200px]">
                              {item.productName} <span className="text-gray-400">× {item.quantity}</span>
                            </span>
                            <span className="font-medium text-gray-900 flex-shrink-0 ml-4">
                              {formatMKD(item.lineTotal ?? item.unitPrice * item.quantity)}
                            </span>
                          </div>
                        ))}
                        <div className="border-t border-gray-200 pt-1.5 flex justify-between text-sm font-semibold">
                          <span>Вкупно</span>
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
    </div>
  )
}
