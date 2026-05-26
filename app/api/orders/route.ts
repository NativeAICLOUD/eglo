const INTERNAL_API_URL =
  process.env.INTERNAL_API_URL ??
  "https://nativeapi-h8e7h4cgc6gpgbea.northeurope-01.azurewebsites.net/api"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const authHeader = request.headers.get("authorization")

    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (authHeader) headers["Authorization"] = authHeader

    const res = await fetch(`${INTERNAL_API_URL}/orders`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })

    const text = await res.text()
    let data: unknown = {}
    if (text.trim()) {
      try { data = JSON.parse(text) } catch { data = { message: text } }
    }

    return Response.json(data, { status: res.status })
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const authHeader = request.headers.get("authorization")

    const headers: Record<string, string> = {}
    if (authHeader) headers["Authorization"] = authHeader

    const res = await fetch(`${INTERNAL_API_URL}/orders?${searchParams.toString()}`, { headers })
    const data = await res.json()
    return Response.json(data, { status: res.status })
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
