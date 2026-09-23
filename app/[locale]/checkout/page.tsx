"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { ChevronLeft, Truck, Store, Check, ShoppingBag, AlertCircle } from "lucide-react"
import { useCart, parseMKD } from "../context/CartContext"
import { useAuth } from "../../../lib/useAuth"
import { formatMKD } from "../../../lib/api"

type Step = "delivery" | "address" | "review" | "success"

interface AddressForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  street: string
  city: string
}

const COURIER_COST = 180
const FREE_THRESHOLD = 3990
const STORE_ADDRESS = "Ул. Места бр.16, Скопје 1000"

export default function CheckoutPage() {
  const { locale } = useParams() as { locale: string }
  const router = useRouter()
  const { items, getTotal, clearCart } = useCart()
  const { user } = useAuth()
  const t = useTranslations("checkout")

  const [step, setStep] = useState<Step>("delivery")
  const [deliveryMethod, setDeliveryMethod] = useState<"courier" | "pickup">("courier")
  const [address, setAddress] = useState<AddressForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
  })
  const [errors, setErrors] = useState<Partial<AddressForm>>({})
  const [placing, setPlacing] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)

  // Pre-fill from profile
  useEffect(() => {
    if (user) {
      setAddress(prev => ({
        ...prev,
        firstName: prev.firstName || user.firstName || "",
        lastName: prev.lastName || user.lastName || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
      }))
    }
  }, [user])

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && step !== "success") {
      router.replace(`/${locale}/cart`)
    }
  }, [items.length, step, locale, router])

  const subtotal = getTotal()
  const deliveryCost = deliveryMethod === "courier" && subtotal < FREE_THRESHOLD ? COURIER_COST : 0
  const total = subtotal + deliveryCost

  const currentStepNum = step === "delivery" ? 2 : step === "address" ? 3 : step === "review" ? 4 : 4

  // --- Address validation ---
  const validateAddress = (): boolean => {
    const required = t("common.required")
    const errs: Partial<AddressForm> = {}
    if (!address.firstName.trim()) errs.firstName = required
    if (!address.lastName.trim()) errs.lastName = required
    if (!address.email.trim()) errs.email = required
    if (deliveryMethod === "courier") {
      if (!address.phone.trim()) errs.phone = required
      if (!address.street.trim()) errs.street = required
      if (!address.city.trim()) errs.city = required
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // --- Place order ---
  const handlePlaceOrder = async () => {
    setPlacing(true)
    setOrderError(null)
    try {
      const payload = {
        customerEmail: address.email,
        customerName: `${address.firstName} ${address.lastName}`.trim(),
        deliveryMethod: deliveryMethod === "courier" ? "Courier" : "Pickup",
        shippingAddress: {
          firstName: address.firstName,
          lastName: address.lastName,
          email: address.email,
          phone: address.phone,
          address: address.street,
          city: address.city,
        },
        items: items.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: parseMKD(item.price),
        })),
        subtotal,
        deliveryCost,
        totalAmount: total,
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) headers["Authorization"] = `Bearer ${token}`

      const res = await fetch("/api/orders", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { message?: string }).message || t("errors.status", { status: res.status }))
      }

      const data = await res.json().catch(() => ({})) as { id?: string; orderId?: string }
      setOrderId(data.id ?? data.orderId ?? null)
      clearCart()
      setStep("success")
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : t("errors.generic"))
    } finally {
      setPlacing(false)
    }
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("success.title")}</h2>
          <p className="text-gray-500 mb-2">{t("success.message")}</p>
          {orderId && (
            <p className="text-sm text-gray-400 mb-6">{t("success.orderNumber")} <span className="font-mono text-gray-700">{orderId}</span></p>
          )}
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {t("success.continueShopping")}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Title + breadcrumb */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <Link href={`/${locale}`} className="hover:text-teal-600 transition-colors">{t("breadcrumb.home")}</Link>
            <span>/</span>
            <Link href={`/${locale}/cart`} className="hover:text-teal-600 transition-colors">{t("breadcrumb.cart")}</Link>
            <span>/</span>
            <span className="text-gray-700">{t("breadcrumb.checkout")}</span>
          </div>
        </div>

        {/* Step indicator */}
        <StepIndicator currentStep={currentStepNum} />

        <div className="mt-6 grid lg:grid-cols-3 gap-6 items-start">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-4">
            {step === "delivery" && (
              <DeliveryStep
                selected={deliveryMethod}
                onSelect={setDeliveryMethod}
                onContinue={() => setStep("address")}
                subtotal={subtotal}
              />
            )}
            {step === "address" && (
              <AddressStep
                form={address}
                errors={errors}
                deliveryMethod={deliveryMethod}
                onChange={(field, val) => setAddress(prev => ({ ...prev, [field]: val }))}
                onBack={() => setStep("delivery")}
                onContinue={() => { if (validateAddress()) setStep("review") }}
              />
            )}
            {step === "review" && (
              <ReviewStep
                items={items}
                deliveryMethod={deliveryMethod}
                address={address}
                subtotal={subtotal}
                deliveryCost={deliveryCost}
                total={total}
                placing={placing}
                error={orderError}
                onBack={() => setStep("address")}
                onPlace={handlePlaceOrder}
              />
            )}
          </div>

          {/* Order summary sidebar */}
          <div className="lg:col-span-1">
            <OrderSummary items={items} subtotal={subtotal} deliveryCost={deliveryCost} total={total} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
  const t = useTranslations("checkout.steps")
  const steps = [
    { num: 1, label: t("cart") },
    { num: 2, label: t("delivery") },
    { num: 3, label: t("address") },
    { num: 4, label: t("review") },
  ]
  return (
    <div className="flex items-center">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center">
          <div className={`flex items-center gap-2 text-sm font-medium ${
            s.num === currentStep ? "text-teal-600" : "text-gray-400"
          }`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${
              s.num < currentStep
                ? "border-teal-600 bg-teal-600 text-white"
                : s.num === currentStep
                ? "border-teal-600 text-teal-600"
                : "border-gray-300 text-gray-400"
            }`}>
              {s.num < currentStep ? <Check className="w-3.5 h-3.5" /> : s.num}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </div>
          {i < steps.length - 1 && <div className="w-6 sm:w-14 h-px bg-gray-200 mx-2" />}
        </div>
      ))}
    </div>
  )
}

// ─── Delivery step ────────────────────────────────────────────────────────────

function DeliveryStep({
  selected, onSelect, onContinue, subtotal,
}: {
  selected: "courier" | "pickup"
  onSelect: (m: "courier" | "pickup") => void
  onContinue: () => void
  subtotal: number
}) {
  const t = useTranslations("checkout")
  const courierFree = subtotal >= FREE_THRESHOLD

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-5">{t("delivery.title")}</h2>

      <div className="space-y-3">
        {/* Courier */}
        <button
          onClick={() => onSelect("courier")}
          className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
            selected === "courier" ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
              selected === "courier" ? "border-teal-500" : "border-gray-300"
            }`}>
              {selected === "courier" && <div className="w-2 h-2 rounded-full bg-teal-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-teal-600" />
                  <a
                    href="https://els-post.mk/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-gray-900 text-sm hover:text-teal-600 hover:underline transition-colors"
                  >
                    ELS Post
                  </a>
                </div>
                <span className={`text-sm font-semibold ${courierFree ? "text-teal-600" : "text-gray-900"}`}>
                  {courierFree ? t("common.free") : formatMKD(COURIER_COST)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                {t("delivery.courierDescription")}
              </p>
              <p className="text-xs text-teal-700 font-medium mt-1">
                {t("delivery.freeThresholdNotice", { amount: formatMKD(FREE_THRESHOLD) })}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{t("delivery.courierTime")}</p>
            </div>
          </div>
        </button>

        {/* Pickup */}
        <button
          onClick={() => onSelect("pickup")}
          className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
            selected === "pickup" ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
              selected === "pickup" ? "border-teal-500" : "border-gray-300"
            }`}>
              {selected === "pickup" && <div className="w-2 h-2 rounded-full bg-teal-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-teal-600" />
                  <span className="font-medium text-gray-900 text-sm">{t("delivery.pickupTitle")}</span>
                </div>
                <span className="text-sm font-semibold text-teal-600">{t("common.free")}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">{t("delivery.pickupDescription")}</p>
              <p className="text-xs text-gray-400 mt-0.5">{STORE_ADDRESS}</p>
            </div>
          </div>
        </button>
      </div>

      <button
        onClick={onContinue}
        className="mt-6 w-full py-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        {t("common.continue")}
      </button>
    </div>
  )
}

// ─── Address step ─────────────────────────────────────────────────────────────

function AddressStep({
  form, errors, deliveryMethod, onChange, onBack, onContinue,
}: {
  form: AddressForm
  errors: Partial<AddressForm>
  deliveryMethod: "courier" | "pickup"
  onChange: (field: keyof AddressForm, val: string) => void
  onBack: () => void
  onContinue: () => void
}) {
  const t = useTranslations("checkout")
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-5">
        {deliveryMethod === "courier" ? t("address.shippingTitle") : t("address.detailsTitle")}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t("address.fields.firstName")} value={form.firstName} error={errors.firstName} onChange={v => onChange("firstName", v)} />
        <Field label={t("address.fields.lastName")} value={form.lastName} error={errors.lastName} onChange={v => onChange("lastName", v)} />
        <Field label={t("address.fields.email")} type="email" value={form.email} error={errors.email} onChange={v => onChange("email", v)} className="sm:col-span-2" />
        <Field label={t("address.fields.phone")} type="tel" value={form.phone} error={errors.phone} onChange={v => onChange("phone", v)} />

        {deliveryMethod === "courier" && (
          <>
            <Field label={t("address.fields.street")} value={form.street} error={errors.street} onChange={v => onChange("street", v)} className="sm:col-span-2" />
            <Field label={t("address.fields.city")} value={form.city} error={errors.city} onChange={v => onChange("city", v)} />
          </>
        )}

        {deliveryMethod === "pickup" && (
          <div className="sm:col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            {t("address.pickupNotice")} <strong>{STORE_ADDRESS}</strong>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> {t("common.back")}
        </button>
        <button
          onClick={onContinue}
          className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {t("common.continue")}
        </button>
      </div>
    </div>
  )
}

function Field({
  label, value, error, type = "text", onChange, className = "",
}: {
  label: string; value: string; error?: string; type?: string
  onChange: (v: string) => void; className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-colors ${
          error ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-teal-500"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ─── Review step ──────────────────────────────────────────────────────────────

function ReviewStep({
  items, deliveryMethod, address, subtotal, deliveryCost, total,
  placing, error, onBack, onPlace,
}: {
  items: ReturnType<typeof useCart>["items"]
  deliveryMethod: "courier" | "pickup"
  address: AddressForm
  subtotal: number; deliveryCost: number; total: number
  placing: boolean; error: string | null
  onBack: () => void; onPlace: () => void
}) {
  const t = useTranslations("checkout")
  return (
    <div className="space-y-4">
      {/* Cart items */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">{t("review.products")}</h3>
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-12 h-12 relative flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                {item.image && item.image !== "/placeholder.svg" ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 line-clamp-1">{item.name}</p>
                <p className="text-xs text-gray-500">{t("review.quantity")}: {item.quantity}</p>
              </div>
              <span className="text-sm font-medium text-gray-900 flex-shrink-0">
                {formatMKD(parseMKD(item.price) * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery info */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">{t("delivery.title")}</h3>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          {deliveryMethod === "courier" ? <Truck className="w-4 h-4 text-teal-600" /> : <Store className="w-4 h-4 text-teal-600" />}
          {deliveryMethod === "courier" ? (
            <a
              href="https://els-post.mk/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-teal-600 hover:underline transition-colors"
            >
              ELS Post
            </a>
          ) : (
            <span>{t("delivery.pickupTitle")}</span>
          )}
          <span className="ml-auto font-medium">{deliveryCost === 0 ? t("common.free") : formatMKD(deliveryCost)}</span>
        </div>

        <h3 className="text-sm font-semibold text-gray-900 mt-4 mb-2">
          {deliveryMethod === "courier" ? t("address.shippingTitle") : t("address.detailsTitle")}
        </h3>
        <div className="text-sm text-gray-600 space-y-0.5">
          <p>{address.firstName} {address.lastName}</p>
          <p>{address.email}</p>
          {address.phone && <p>{address.phone}</p>}
          {deliveryMethod === "courier" && <p>{address.street}, {address.city}</p>}
          {deliveryMethod === "pickup" && <p className="text-gray-500">{STORE_ADDRESS}</p>}
        </div>
      </div>

      {/* Total */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>{t("review.subtotal")}</span><span>{formatMKD(subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>{t("steps.delivery")}</span>
            <span>{deliveryCost === 0 ? t("common.free") : formatMKD(deliveryCost)}</span>
          </div>
        </div>
        <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-semibold text-base">
          <span>{t("review.totalDue")}</span>
          <span className="text-teal-600">{formatMKD(total)}</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={placing}
          className="flex items-center gap-2 px-4 py-3 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" /> {t("common.back")}
        </button>
        <button
          onClick={onPlace}
          disabled={placing}
          className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {placing ? t("review.placing") : t("review.placeOrder")}
        </button>
      </div>
    </div>
  )
}

// ─── Order summary sidebar ────────────────────────────────────────────────────

function OrderSummary({
  items, subtotal, deliveryCost, total,
}: {
  items: ReturnType<typeof useCart>["items"]
  subtotal: number; deliveryCost: number; total: number
}) {
  const t = useTranslations("checkout")
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sticky top-24">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">{t("summary.title")}</h2>

      <div className="space-y-3 max-h-60 overflow-y-auto">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2">
            <div className="w-10 h-10 relative flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
              {item.image && item.image !== "/placeholder.svg" ? (
                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="40px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-3 h-3 text-gray-300" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-700 line-clamp-1">{item.name}</p>
              <p className="text-xs text-gray-400">× {item.quantity}</p>
            </div>
            <span className="text-xs font-medium text-gray-800 flex-shrink-0">
              {formatMKD(parseMKD(item.price) * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 mt-4 pt-4 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>{t("review.products")}</span><span>{formatMKD(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>{t("steps.delivery")}</span>
          <span>{deliveryCost === 0 ? t("common.free") : formatMKD(deliveryCost)}</span>
        </div>
        <div className="flex justify-between font-semibold text-base border-t border-gray-100 pt-2 mt-2">
          <span>{t("summary.total")}</span>
          <span className="text-teal-600">{formatMKD(total)}</span>
        </div>
      </div>
    </div>
  )
}
