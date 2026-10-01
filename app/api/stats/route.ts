import { forwardToApi } from "../../../lib/proxy"

// Admin-only on the backend (it includes revenue), so the caller's login is forwarded.
export async function GET(request: Request) {
  return forwardToApi(request, "/stats", "GET")
}
