// Crops the excessive white padding baked into the source product photos
// (common for tall/narrow fixtures like pendant lights) so the gallery and
// lightbox can show the product larger without stretching or cropping it.
// Pure display-layer proxy — never touches the original image, DB, or API.
import type { FormatEnum } from "sharp"

export const runtime = "nodejs"

const ALLOWED_HOSTS = new Set(["pub-166082e4b3d54bb296c0e624eb1a1f50.r2.dev"])

// Breathing room added back after trimming so the product doesn't touch the frame edge.
const PADDING_RATIO = 0.04
// If trimming would remove more than this fraction of the image, treat it as a
// misdetection (e.g. a near-blank photo) and serve the original untouched.
const MIN_KEPT_AREA_RATIO = 0.03

function contentTypeFor(format: string | undefined): string {
  switch (format) {
    case "png": return "image/png"
    case "webp": return "image/webp"
    case "avif": return "image/avif"
    default: return "image/jpeg"
  }
}

function originalResponse(buffer: Buffer, contentType: string): Response {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=604800, stale-while-revalidate=2592000",
    },
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const src = searchParams.get("url")
  const debug = searchParams.get("debug") === "1"
  if (!src) return new Response("Missing url", { status: 400 })

  let parsed: URL
  try {
    parsed = new URL(src)
  } catch {
    return new Response("Invalid url", { status: 400 })
  }
  if (parsed.protocol !== "https:" || !ALLOWED_HOSTS.has(parsed.hostname)) {
    return new Response("Host not allowed", { status: 400 })
  }

  const upstream = await fetch(parsed.toString())
  if (!upstream.ok) return new Response("Upstream fetch failed", { status: 502 })
  const inputBuffer = Buffer.from(await upstream.arrayBuffer())
  const upstreamContentType = upstream.headers.get("content-type") ?? "image/jpeg"

  // sharp is a native addon — importing it lazily inside this try/catch means a
  // failure to load its binary is caught and handled the same as any other
  // processing failure, instead of crashing the whole route before we can
  // fall back to serving the original image.
  try {
    const sharpModule = await import("sharp")
    const sharp = sharpModule.default

    const meta = await sharp(inputBuffer).metadata()
    const originalArea = (meta.width ?? 0) * (meta.height ?? 0)

    const { data: trimmedData, info: trimmedInfo } = await sharp(inputBuffer)
      .trim({ threshold: 15 })
      .toBuffer({ resolveWithObject: true })

    const trimmedArea = trimmedInfo.width * trimmedInfo.height
    if (!originalArea || trimmedArea / originalArea < MIN_KEPT_AREA_RATIO) {
      // Trim removed almost everything — likely a misdetection. Serve the original.
      return originalResponse(inputBuffer, contentTypeFor(meta.format))
    }

    const pad = Math.round(Math.max(trimmedInfo.width, trimmedInfo.height) * PADDING_RATIO)
    const background = meta.hasAlpha
      ? { r: 0, g: 0, b: 0, alpha: 0 }
      : await sampleTopLeftColor(sharp, inputBuffer)

    const finalBuffer = await sharp(trimmedData)
      .extend({ top: pad, bottom: pad, left: pad, right: pad, background })
      .toFormat((meta.format ?? "jpeg") as keyof FormatEnum)
      .toBuffer()

    return originalResponse(finalBuffer, contentTypeFor(meta.format))
  } catch (err) {
    if (debug) {
      return Response.json(
        { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined },
        { status: 500 }
      )
    }
    // Any processing failure falls back to the untouched original — never breaks the page.
    return originalResponse(inputBuffer, upstreamContentType)
  }
}

async function sampleTopLeftColor(
  sharp: typeof import("sharp").default,
  buffer: Buffer
): Promise<{ r: number; g: number; b: number; alpha: number }> {
  const pixel = await sharp(buffer)
    .extract({ left: 0, top: 0, width: 1, height: 1 })
    .raw()
    .toBuffer()
  return { r: pixel[0], g: pixel[1], b: pixel[2], alpha: 1 }
}
