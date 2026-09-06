const INTERNAL_API_URL =
  process.env.INTERNAL_API_URL ??
  "https://nativeapi-h8e7h4cgc6gpgbea.northeurope-01.azurewebsites.net/api"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return Response.json(
        { message: "Authentication token required" },
        { status: 401 }
      )
    }

    const upstream = await fetch(`${INTERNAL_API_URL}/orders/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify(body),
    })

    const text = await upstream.text()
    let data: unknown = {}
    if (text.trim()) {
      try { data = JSON.parse(text) } catch { data = { message: text } }
    }

    return Response.json(data, { status: upstream.status })
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
