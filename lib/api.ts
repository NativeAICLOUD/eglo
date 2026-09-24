// lib/api.ts

// In the browser, always use same-origin proxy routes (avoids CORS entirely).
// On the server (SSR), call the Azure API directly via INTERNAL_API_URL.
export const API_BASE_URL =
  typeof window !== "undefined"
    ? "/api"
    : (
        process.env.INTERNAL_API_URL ??
        "https://nativeapi-h8e7h4cgc6gpgbea.northeurope-01.azurewebsites.net/api"
      ).replace(/\/$/, "");

// ----------------------------- Types ----------------------------------------
export interface BackendCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description?: string | null;
  imageUrl?: string | null;
  subcategories: BackendCategory[];
}

export interface BackendProductImage {
  id: string;
  url: string;
  order?: number;
}

export const PROMO_POPUP_LOCALES = ["mk", "en", "sq"] as const;
export type PromoPopupLocale = typeof PROMO_POPUP_LOCALES[number];

export interface PromoPopupContent {
  title: string;
  text: string;
  ctaText?: string | null;
}

export interface PromoPopupSettings {
  enabled: boolean;
  imageUrl?: string | null;
  ctaLink?: string | null;
  translations: Record<PromoPopupLocale, PromoPopupContent>;
  /** Server version of the loaded settings; sent back on save to detect edits from another window. */
  updatedAt?: string | null;
}

export interface PriceListImportResult {
  dryRun: boolean;
  rowsRead: number;
  created: number;
  priceChanged: number;
  nameChanged: number;
  unchanged: number;
  skipped: number;
  newProducts: { sku: string; name: string; price: number }[];
  priceChanges: { sku: string; name: string; oldPrice: number; newPrice: number }[];
  skippedRows: { row: number; reason: string; sku?: string | null; name?: string | null }[];
}

export interface BackendProduct {
  id: string;
  /** Full EGLO spec string e.g. "LED-DL SCHWARZ/WEISS 'PALMARES'" — returned as "name" by detail endpoint */
  title: string;
  name?: string;
  /** Product code e.g. "300384" — returned as "description" by detail endpoint */
  sku: string;
  description?: string | null;
  /** Price in MKD */
  price: number;
  /** Percentage off price (0-100), null/undefined means no active discount */
  discountPercentage?: number | null;
  /** Admin-controlled flag that shows the NEW badge */
  isNew?: boolean;
  imageUrl: string | null;
  createdDate: string;
  // Fields present on paginated list + single-product responses
  categoryId?: string | null;
  subcategoryId?: string | null;
  categoryName?: string | null;
  subcategoryName?: string | null;
  category?: string;
  isPublished?: boolean;
  status?: string;
  images?: Array<string | BackendProductImage>;
  productDetailsJson?: string | null;
  dimensionsJson?: string | null;
  technicalInfoJson?: string | null;
  otherInfoJson?: string | null;
}

export interface PaginatedProducts {
  items: BackendProduct[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ProductQueryParams {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
  search?: string;
  categorySlug?: string;
  uncategorized?: boolean;
  isNew?: boolean;
}

/** Extract the quoted model name from a German EGLO spec string.
 *  "LED-DL SCHWARZ/WEISS 'PALMARES'" → "PALMARES"
 *  Falls back to the full title if no quotes found. */
export function parseProductName(raw: string | null | undefined): string {
  if (!raw) return ''
  const match = raw.match(/'([^']+)'/)
  return match ? match[1] : raw
}

/** Format a MKD price for display (comma = thousands separator, no decimal cents) */
export function formatMKD(price: number): string {
  const mkd = Math.round(price)
  return `${mkd.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} ден.`
}

/** Returns the discounted price, or the original price if there's no active discount. */
export function getDiscountedPrice(price: number, discountPercentage?: number | null): number {
  if (!discountPercentage || discountPercentage <= 0) return price
  return price - (price * discountPercentage) / 100
}

const R2_IMAGE_HOST = 'pub-166082e4b3d54bb296c0e624eb1a1f50.r2.dev'

/** Route a product photo through the whitespace-trim proxy so source images with
 *  large embedded padding (common for tall/narrow fixtures) display larger without
 *  stretching or cropping the product. Non-catalog URLs pass through untouched. */
export function trimmedImageSrc(url: string | null | undefined): string {
  if (!url) return url ?? ''
  try {
    if (new URL(url).hostname !== R2_IMAGE_HOST) return url
  } catch {
    return url
  }
  return `/api/image-trim?url=${encodeURIComponent(url)}`
}

/** Strip a trailing colon some admin-entered spec labels carry, e.g. "Material:" → "Material" */
export function stripTrailingColon(label: string): string {
  return label.replace(/[:：]+\s*$/, '').trim()
}

/** Turn camelCase/snake_case/kebab-case into normal Title Case text — used as a display
 *  fallback for spec labels that have no i18n dictionary entry. */
export function humanizeSpecLabel(label: string): string {
  const spaced = label
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
  if (!spaced) return label
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/** Convert a "Key: Value" per-line specifications blob (the admin Notes-style textarea)
 *  into a JSON object string, preserving line order. Returns null when there's nothing to save. */
export function specTextToJson(text: string): string | null {
  const entries: [string, string][] = []
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    if (!key || !value) continue
    entries.push([key, value])
  }
  return entries.length > 0 ? JSON.stringify(Object.fromEntries(entries)) : null
}

/** Convert a stored specifications JSON object string back into "Key: Value" lines, for
 *  prefilling the admin textarea. Legacy camelCase keys are humanized for readability. */
export function specJsonToLines(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const obj = JSON.parse(raw)
    if (typeof obj !== 'object' || obj === null) return []
    return Object.entries(obj)
      .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
      .map(([k, v]) => `${humanizeSpecLabel(stripTrailingColon(k))}: ${String(v).trim()}`)
  } catch {
    return []
  }
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupRequest {
  email: string;
  password: string;
}

export interface EgloApiResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    email: string;
    userId: string;
    roles?: string[];
  };
  errors?: string[];
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    roles?: string[];
  };
  expiresIn?: number;
}

// ----------------------------- Error ----------------------------------------
export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export const isApiError = (e: unknown): e is ApiError =>
  typeof e === "object" &&
  e !== null &&
  (e as { name: unknown }).name === "ApiError" &&
  "status" in (e as object);

// ----------------------------- Internals ------------------------------------
const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const hasStringMessage = (v: unknown): v is { message: string } =>
  isObject(v) && typeof (v as { message: unknown }).message === "string";

// ----------------------------- Service --------------------------------------
class ApiService {
  constructor(private baseURL: string = API_BASE_URL) {}

  private url(endpoint: string) {
    return `${this.baseURL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = this.url(endpoint);

    if (process.env.NODE_ENV !== "production") {
      console.log("🔍 API_BASE_URL:", this.baseURL);
      console.log("🔍 endpoint:", endpoint);
      console.log("🔍 Full URL:", url);
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    const token = this.getToken();
    if (token) {
      (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    const res = await fetch(url, { ...options, headers });

    if (!res.ok) {
      if (res.status === 401 && token && !endpoint.startsWith("/auth/")) this.handleUnauthorized();
      let body: unknown = {};
      try {
        body = await res.json();
      } catch {}

      const message = hasStringMessage(body)
        ? body.message
        : `HTTP error! status: ${res.status}`;

      throw new ApiError(message, res.status, body);
    }

    return (await res.json()) as T;
  }

  // ------------------------- Public endpoints --------------------------------
  async getStats(): Promise<{ totalProducts: number; totalCategories: number; totalUsers: number }> {
    return this.request<{ totalProducts: number; totalCategories: number; totalUsers: number }>("/stats");
  }

  async getCategories(): Promise<BackendCategory[]> {
    return this.request<BackendCategory[]>("/categories");
  }

  async createCategory(input: { name: string; slug: string; parentId?: string | null; icon?: string | null }): Promise<string> {
    const res = await this.request<{ id: string }>("/categories", {
      method: "POST",
      body: JSON.stringify({ ...input, sortOrder: 0 }),
    });
    return res.id;
  }

  async getCategoryBySlug(slug: string): Promise<BackendCategory> {
    return this.request<BackendCategory>(`/categories/by-slug/${slug}`);
  }

  async getProducts(params?: ProductQueryParams): Promise<PaginatedProducts> {
    const qs = new URLSearchParams();
    if (params?.categoryId)        qs.set("CategoryId",    params.categoryId);
    if (params?.categorySlug)      qs.set("categorySlug",  params.categorySlug);
    if (params?.search)            qs.set("search",        params.search);
    if (params?.minPrice != null)  qs.set("minPrice",      String(params.minPrice));
    if (params?.maxPrice != null)  qs.set("maxPrice",      String(params.maxPrice));
    // page is required by the backend; default to 1
    qs.set("page",     String(params?.page     ?? 1));
    qs.set("pageSize", String(params?.pageSize ?? 20));
    if (params?.uncategorized)     qs.set("uncategorized", "true");
    if (params?.isNew != null)     qs.set("isNew",         String(params.isNew));
    return this.request<PaginatedProducts>(`/products?${qs.toString()}`);
  }

  /** Shows or hides the NEW badge on the given products. */
  async setProductsNew(productIds: string[], isNew: boolean): Promise<void> {
    await this.request<unknown>("/products/new", {
      method: "POST",
      body: JSON.stringify({ productIds, isNew }),
    });
  }

  async getBestSellers(take: number = 8): Promise<BackendProduct[]> {
    return this.request<BackendProduct[]>(`/products/best-sellers?take=${take}`);
  }

  /** Uploads an EGLO price list. With dryRun, nothing is saved — the result is a preview. */
  async importPriceList(file: File, dryRun: boolean): Promise<PriceListImportResult> {
    const formData = new FormData();
    formData.append("file", file);

    const token = this.getToken();
    const res = await fetch(this.url(`/products/import?dryRun=${dryRun}`), {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    if (!res.ok) {
      if (res.status === 401 && token) this.handleUnauthorized();
      const body = await res.json().catch(() => ({}));
      throw new ApiError((body as { message?: string }).message ?? `Import failed (${res.status})`, res.status, body);
    }
    return res.json() as Promise<PriceListImportResult>;
  }

  async getProductCategoryStats(): Promise<{ uncategorized: number }> {
    return this.request<{ uncategorized: number }>("/products/category-stats");
  }

  async bulkAssignCategory(productIds: string[], categoryId: string): Promise<void> {
    await this.request<unknown>("/products/bulk-category", {
      method: "PUT",
      body: JSON.stringify({ productIds, categoryId }),
    });
  }

  async getProduct(id: string): Promise<BackendProduct> {
    const p = await this.request<BackendProduct>(`/products/${id}`);
    // The detail endpoint returns the spec string as `name` and the product
    // code as `description`, whereas the list endpoint returns them as `title`
    // and `sku`. Normalize so consumers can rely on `title`/`sku` either way.
    return {
      ...p,
      title: p.title ?? p.name ?? "",
      sku: p.sku ?? p.description ?? "",
    };
  }

  async deleteProduct(id: string): Promise<void> {
    await this.request<unknown>(`/products/${id}`, { method: "DELETE" });
  }

  async updateProduct(id: string, data: {
    name: string;
    description: string;
    price: number;
    productDetailsJson?: string | null;
    dimensionsJson?: string | null;
    technicalInfoJson?: string | null;
    otherInfoJson?: string | null;
    discountPercentage?: number | null;
  }): Promise<void> {
    await this.request<unknown>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /** Sets or clears (pass null) a product's discount percentage (0-100). */
  async setProductDiscount(id: string, discountPercentage: number | null): Promise<void> {
    await this.request<unknown>(`/products/${id}/discount`, {
      method: "PUT",
      body: JSON.stringify({ discountPercentage }),
    });
  }

  async createProduct(data: Record<string, unknown>): Promise<BackendProduct> {
    return this.request<BackendProduct>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /** Uploads one or more image files for a product. Bypasses request() since
   *  FormData needs the browser to set its own multipart Content-Type/boundary. */
  async uploadProductImages(id: string, files: File[]): Promise<BackendProductImage[]> {
    const formData = new FormData();
    files.forEach(file => formData.append("files", file));

    const token = this.getToken();
    const res = await fetch(this.url(`/products/${id}/images`), {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    if (!res.ok) {
      if (res.status === 401 && token) this.handleUnauthorized();
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { message?: string }).message ?? "Image upload failed");
    }

    const data = await res.json() as { images: BackendProductImage[] };
    return data.images;
  }

  async deleteProductImage(productId: string, imageId: string): Promise<void> {
    await this.request<unknown>(`/products/${productId}/images/${imageId}`, {
      method: "DELETE",
    });
  }

  async getPromoPopup(): Promise<PromoPopupSettings> {
    const data = await this.request<Partial<PromoPopupSettings>>("/promo-popup");
    const translations = {} as Record<PromoPopupLocale, PromoPopupContent>;
    for (const locale of PROMO_POPUP_LOCALES) {
      const c = data.translations?.[locale];
      translations[locale] = { title: c?.title ?? "", text: c?.text ?? "", ctaText: c?.ctaText ?? null };
    }
    return {
      enabled: data.enabled ?? false,
      imageUrl: data.imageUrl ?? null,
      ctaLink: data.ctaLink ?? null,
      translations,
      updatedAt: data.updatedAt ?? null,
    };
  }

  /** Returns the new server version. Rejects (409) if the settings changed since `settings.updatedAt`. */
  async updatePromoPopup(settings: PromoPopupSettings): Promise<string | null> {
    const { updatedAt, ...rest } = settings;
    const res = await this.request<{ updatedAt?: string }>("/promo-popup", {
      method: "PUT",
      body: JSON.stringify({ ...rest, expectedUpdatedAt: updatedAt ?? null }),
    });
    return res?.updatedAt ?? null;
  }

  /** Machine-translates popup copy from `from` into the other popup locales (not saved). */
  async translatePromoPopup(
    from: PromoPopupLocale,
    content: PromoPopupContent,
  ): Promise<Record<PromoPopupLocale, PromoPopupContent>> {
    return this.request<Record<PromoPopupLocale, PromoPopupContent>>("/promo-popup/translate", {
      method: "POST",
      body: JSON.stringify({ from, content }),
    });
  }

  /** Bypasses request() since FormData needs the browser to set its own
   *  multipart Content-Type/boundary. */
  async uploadPromoPopupImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const token = this.getToken();
    const res = await fetch(this.url("/promo-popup/image"), {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    if (!res.ok) {
      if (res.status === 401 && token) this.handleUnauthorized();
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { message?: string }).message ?? "Image upload failed");
    }

    const data = await res.json() as { url: string };
    return data.url;
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const eglo = await this.request<EgloApiResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    return this.toAuthResponse(eglo);
  }

  async signup(data: SignupRequest): Promise<{ success: boolean; message: string }> {
    const eglo = await this.request<EgloApiResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        Email: data.email,
        Password: data.password,
      }),
    });

    if (!eglo.success) {
      throw new ApiError(eglo.message || "Signup failed", 400, eglo.errors);
    }

    return { success: eglo.success, message: eglo.message };
  }

  logout(): void {
    this.removeToken();
  }

  async refreshToken(): Promise<AuthResponse> {
    throw new ApiError("Token refresh not implemented", 501);
  }

  // --------------------------- Token helpers ---------------------------------
  /** The stored login was rejected (expired) — clear it and send the user to log in again. */
  private handleUnauthorized(): void {
    if (typeof window === "undefined") return;
    this.removeToken();
    this.removeUserEmail();
    const locale = window.location.pathname.split("/")[1] || "mk";
    window.location.href = `/${locale}/login`;
  }

  setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
  }

  getToken(): string | null {
    return typeof window !== "undefined"
      ? localStorage.getItem("auth_token")
      : null;
  }

  removeToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }

  setUserEmail(email: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_email", email);
    }
  }

  getUserEmail(): string | null {
    return typeof window !== "undefined"
      ? localStorage.getItem("auth_email")
      : null;
  }

  removeUserEmail(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_email");
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // ------------------------- Convert helper ----------------------------------
  private toAuthResponse(r: EgloApiResponse): AuthResponse {
    if (!r.success || !r.token || !r.user) {
      throw new ApiError(r.message || "Authentication failed", 400, r.errors);
    }

    return {
      token: r.token,
      user: {
        id: r.user.userId,
        email: r.user.email,
        firstName: "",
        lastName: "",
        phone: "",
        roles: r.user.roles,
      },
    };
  }
}

export const apiService = new ApiService();
