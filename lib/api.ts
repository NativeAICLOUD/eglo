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
    return this.request<PaginatedProducts>(`/products?${qs.toString()}`);
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
    return this.request<BackendProduct>(`/products/${id}`);
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
  }): Promise<void> {
    await this.request<unknown>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async createProduct(data: Record<string, unknown>): Promise<BackendProduct> {
    return this.request<BackendProduct>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    });
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
