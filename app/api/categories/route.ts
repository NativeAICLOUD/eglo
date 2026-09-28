import { forwardToApi, proxiedReadCacheControl } from "../../../lib/proxy"

const INTERNAL_API_URL =
  process.env.INTERNAL_API_URL ??
  "https://nativeapi-h8e7h4cgc6gpgbea.northeurope-01.azurewebsites.net/api"

export async function GET(request: Request) {
  try {
    const res = await fetch(`${INTERNAL_API_URL}/categories`)
    const data = await res.json()
    return Response.json(data, {
      status: res.status,
      headers: { "Cache-Control": proxiedReadCacheControl(request, res) },
    })
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  return forwardToApi(request, "/categories", "POST")
}
