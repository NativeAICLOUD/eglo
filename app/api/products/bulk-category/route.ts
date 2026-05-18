const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? "http://localhost:5181/api"

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return Response.json(
        { success: false, message: "Authentication token required" },
        { status: 401 }
      )
    }

    const upstream = await fetch(`${INTERNAL_API_URL}/products/bulk-category`, {
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
