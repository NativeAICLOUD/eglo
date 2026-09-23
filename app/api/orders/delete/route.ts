import { forwardToApi } from "../../../../lib/proxy"

export async function POST(request: Request) {
  return forwardToApi(request, "/orders/delete", "POST")
}
