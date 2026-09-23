import { forwardToApi } from "../../../../lib/proxy"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return forwardToApi(request, `/orders/${encodeURIComponent(id)}`, "DELETE")
}
