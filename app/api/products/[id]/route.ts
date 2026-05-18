const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? "http://localhost:5181/api"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("authorization")
    const headers: Record<string, string> = {}
    if (authHeader) headers["Authorization"] = authHeader

    console.log(`[GET /api/products/${id}] proxying to backend`)
    const res = await fetch(`${INTERNAL_API_URL}/products/${id}`, { headers })
    console.log(`[GET /api/products/${id}] backend responded: ${res.status}`)

    const text = await res.text()
    let body: unknown = {}
    if (text.trim()) {
      try { body = JSON.parse(text) } catch { body = { message: text } }
    }
    return Response.json(body, { status: res.status })
  } catch (error) {
    console.error(`[GET /api/products] error:`, error)
    return Response.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return Response.json(
        { success: false, message: "Authentication token required" },
        { status: 401 }
      )
    }

    const upstream = await fetch(`${INTERNAL_API_URL}/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify(body),
    })

    const responseText = await upstream.text()
    let data: unknown = {}
    if (responseText.trim()) {
      try { data = JSON.parse(responseText) } catch { data = { message: responseText } }
    }

    return Response.json(data, { status: upstream.status })
  } catch (error) {
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = _request.headers.get("authorization")

    if (!authHeader) {
      return Response.json(
        { success: false, message: "Authentication token required" },
        { status: 401 }
      )
    }

    const upstream = await fetch(`${INTERNAL_API_URL}/products/${id}`, {
      method: "DELETE",
      headers: { "Authorization": authHeader },
    })

    const responseText = await upstream.text()
    let data: unknown = {}
    if (responseText.trim()) {
      try { data = JSON.parse(responseText) } catch { data = { message: responseText } }
    }

    return Response.json(data, { status: upstream.status })
  } catch (error) {
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
