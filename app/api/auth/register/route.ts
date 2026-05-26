const INTERNAL_API_URL =
  process.env.INTERNAL_API_URL ??
  "https://nativeapi-h8e7h4cgc6gpgbea.northeurope-01.azurewebsites.net/api"

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(
      `${INTERNAL_API_URL}/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    return Response.json(data, { status: response.status });
  } catch (err) {
    console.error("Registration error:", err);
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
