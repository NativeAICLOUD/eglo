const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? "http://localhost:5181/api"

export async function GET() {
  try {
    const res = await fetch(`${INTERNAL_API_URL}/categories`)
    const data = await res.json()
    return Response.json(data, { status: res.status })
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
