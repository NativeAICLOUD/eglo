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

    const whitened = meta.hasAlpha ? null : await whitenStudioBackground(sharp, inputBuffer)
    const source = whitened ?? inputBuffer

    const { data: trimmedData, info: trimmedInfo } = await sharp(source)
      .trim({ threshold: 15 })
      .toBuffer({ resolveWithObject: true })

    const trimmedArea = trimmedInfo.width * trimmedInfo.height
    if (!originalArea || trimmedArea / originalArea < MIN_KEPT_AREA_RATIO) {
      // Trim removed almost everything — likely a misdetection. Serve the original.
      return originalResponse(inputBuffer, contentTypeFor(meta.format))
    }

    const pad = Math.round(Math.max(trimmedInfo.width, trimmedInfo.height) * PADDING_RATIO)
    // Padding is always white so every card image area stays pure white edge to edge.
    const background = meta.hasAlpha
      ? { r: 0, g: 0, b: 0, alpha: 0 }
      : { r: 255, g: 255, b: 255, alpha: 1 }

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

// Studio shots on a very light gray backdrop show as a gray box on the white
// product cards. When the photo's border is a uniform light color, pixels close
// to that color become pure white (with a soft blend band so edges stay clean).
// Real gray backdrops and room scenes don't pass the checks and are left alone.
const BACKDROP_MIN_LEVEL = 215
const BACKDROP_UNIFORM_SHARE = 0.85
const BACKDROP_EDGE_TOLERANCE = 12
const WHITEN_FULL = 12
const WHITEN_BLEND = 30

async function whitenStudioBackground(
  sharp: typeof import("sharp").default,
  buffer: Buffer
): Promise<Buffer | null> {
  const { data, info } = await sharp(buffer).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h, channels: c } = info
  if (!w || !h) return null

  const samples: [number, number, number][] = []
  const step = Math.max(1, Math.floor(Math.min(w, h) / 100))
  const push = (x: number, y: number) => {
    const i = (y * w + x) * c
    samples.push([data[i], data[i + 1], data[i + 2]])
  }
  for (let x = 0; x < w; x += step) { push(x, 0); push(x, h - 1) }
  for (let y = 0; y < h; y += step) { push(0, y); push(w - 1, y) }

  const median = (k: number) => samples.map(s => s[k]).sort((a, b) => a - b)[Math.floor(samples.length / 2)]
  const bg = [median(0), median(1), median(2)]
  const level = Math.min(...bg)
  if (level >= 250 || level < BACKDROP_MIN_LEVEL) return null

  const dist = (r: number, g: number, b: number) =>
    Math.max(Math.abs(r - bg[0]), Math.abs(g - bg[1]), Math.abs(b - bg[2]))
  const uniform = samples.filter(s => dist(s[0], s[1], s[2]) <= BACKDROP_EDGE_TOLERANCE).length / samples.length
  if (uniform < BACKDROP_UNIFORM_SHARE) return null

  for (let i = 0; i < data.length; i += c) {
    const d = dist(data[i], data[i + 1], data[i + 2])
    if (d >= WHITEN_BLEND) continue
    const t = d <= WHITEN_FULL ? 1 : (WHITEN_BLEND - d) / (WHITEN_BLEND - WHITEN_FULL)
    for (let k = 0; k < 3; k++) data[i + k] = Math.round(data[i + k] + (255 - data[i + k]) * t)
  }

  return sharp(data, { raw: { width: w, height: h, channels: c } })
    .jpeg({ quality: 92 })
    .toBuffer()
}
