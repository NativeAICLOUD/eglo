const INTERNAL_API_URL =
  process.env.INTERNAL_API_URL ??
  "https://nativeapi-h8e7h4cgc6gpgbea.northeurope-01.azurewebsites.net/api"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return Response.json(
        { success: false, message: "Authentication token required" },
        { status: 401 }
      )
    }

    // Must match CreateProductDto exactly (name, description, price, *Json, discountPercentage) —
    // it has no categoryId field at all; category is assigned via a separate
    // PUT /products/{id}/category call once the draft exists (see add-product page).
    const egloApiBody = {
      name:               body.name,
      description:        body.description ?? null,
      price:              parseFloat(body.price) || 0,
      productDetailsJson: body.productDetailsJson ?? null,
      dimensionsJson:     null,
      technicalInfoJson:  null,
      otherInfoJson:      null,
      discountPercentage: body.discountPercentage ? parseFloat(body.discountPercentage) : null,
    }

    const upstream = await fetch(`${INTERNAL_API_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify(egloApiBody),
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
