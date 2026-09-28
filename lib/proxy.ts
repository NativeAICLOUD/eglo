const INTERNAL_API_URL =
  process.env.INTERNAL_API_URL ??
  "https://nativeapi-h8e7h4cgc6gpgbea.northeurope-01.azurewebsites.net/api"

/**
 * Cache-Control for a proxied public read: passes on what the backend allows (it marks
 * catalog reads CDN-cacheable for a short time), but never for signed-in requests —
 * the client tags those with auth=1 — so an admin always sees fresh data.
 */
export function proxiedReadCacheControl(request: Request, upstream: Response): string {
  const signedIn = request.headers.has("authorization") || new URL(request.url).searchParams.has("auth")
  if (signedIn || !upstream.ok) return "private, no-store"
  return upstream.headers.get("cache-control") ?? "private, no-store"
}

/** Forwards a route-handler request to the backend API, passing through auth, body and status. */
export async function forwardToApi(request: Request, path: string, method: string): Promise<Response> {
  try {
    const headers: Record<string, string> = {}
    const authHeader = request.headers.get("authorization")
    if (authHeader) headers["Authorization"] = authHeader

    let body: string | undefined
    if (method !== "GET" && method !== "DELETE") {
      body = await request.text()
      headers["Content-Type"] = "application/json"
    }

    const upstream = await fetch(`${INTERNAL_API_URL}${path}`, { method, headers, body })

    const text = await upstream.text()
    if (upstream.status === 204 || !text.trim()) {
      return new Response(null, { status: upstream.status === 200 ? 204 : upstream.status })
    }
    let data: unknown
    try { data = JSON.parse(text) } catch { data = { message: text } }
    return Response.json(data, { status: upstream.status })
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
