import { NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"
import { createCanvas } from "@napi-rs/canvas"
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import outputs from "@/amplify_outputs.json"

const region = outputs.storage.aws_region
const bucket = outputs.storage.bucket_name
const s3 = new S3Client({ region })

const STICKER_WIDTH = 1024
const STICKER_HEIGHT = 1024
const STICKER_RADIUS = 54
const BACKGROUND = "#8CFF1A"
const FOREGROUND = "#111111"
const WEBSITE = "ifound.sg"
const TAGLINE = ["Prevent item loss", "with QR code stickers", "powered by kindness"]

function objectKey(code: string) {
  return `public/qr-codes/${code}.png`
}

function withRoundedRect(
  ctx: ReturnType<typeof createCanvas>["getContext"],
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function drawBackground(ctx: ReturnType<typeof createCanvas>["getContext"]) {
  ctx.fillStyle = BACKGROUND
  withRoundedRect(ctx, 0, 0, STICKER_WIDTH, STICKER_HEIGHT, STICKER_RADIUS)
  ctx.fill()

  ctx.save()
  withRoundedRect(ctx, 0, 0, STICKER_WIDTH, STICKER_HEIGHT, STICKER_RADIUS)
  ctx.clip()

  ctx.strokeStyle = "rgba(255,255,255,0.08)"
  ctx.lineWidth = 1
  for (let y = 0; y < STICKER_HEIGHT; y += 8) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(STICKER_WIDTH, y + 2)
    ctx.stroke()
  }

  const glow = ctx.createLinearGradient(0, 0, STICKER_WIDTH, STICKER_HEIGHT)
  glow.addColorStop(0, "rgba(255,255,255,0.16)")
  glow.addColorStop(0.5, "rgba(255,255,255,0)")
  glow.addColorStop(1, "rgba(0,0,0,0.08)")
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, STICKER_WIDTH, STICKER_HEIGHT)
  ctx.restore()
}

async function createSticker(code: string, payload: string) {
  const canvas = createCanvas(STICKER_WIDTH, STICKER_HEIGHT)
  const ctx = canvas.getContext("2d")

  drawBackground(ctx)

  ctx.fillStyle = FOREGROUND
  ctx.textBaseline = "top"

  ctx.font = "bold 168px Arial"
  ctx.fillText("iFound", 70, 78)

  ctx.font = "bold 58px Arial"
  ctx.fillText("R", 920, 106)
  ctx.beginPath()
  ctx.lineWidth = 10
  ctx.arc(940, 126, 34, 0, Math.PI * 2)
  ctx.strokeStyle = FOREGROUND
  ctx.stroke()

  const qrCanvas = createCanvas(460, 460)
  await QRCode.toCanvas(qrCanvas as any, payload, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 460,
    color: {
      dark: FOREGROUND,
      light: "#0000",
    },
  })
  ctx.drawImage(qrCanvas as any, 58, 365, 460, 460)

  ctx.font = "bold 82px Arial"
  ctx.fillText("iFound", 170, 590)

  ctx.font = "bold 58px Arial"
  let y = 405
  for (const line of TAGLINE) {
    ctx.fillText(line, 585, y)
    y += 72
  }

  ctx.beginPath()
  ctx.lineWidth = 12
  ctx.arc(690, 705, 64, 0, Math.PI * 2)
  ctx.stroke()
  ctx.font = "bold 118px Arial"
  ctx.fillText("R", 650, 650)

  ctx.font = "bold 72px Arial"
  ctx.fillText(WEBSITE, 585, 808)

  ctx.font = "bold 42px Arial"
  ctx.fillText(`Code ${code}`, 75, 864)

  ctx.font = "32px Arial"
  ctx.fillText("Scan to contact the owner securely", 75, 913)

  return canvas.toBuffer("image/png")
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const code = String(body?.code || "").trim()
    const payload = String(body?.payload || "").trim()

    if (!code || !payload) {
      return NextResponse.json({ error: "code and payload are required" }, { status: 400 })
    }

    const png = await createSticker(code, payload)
    const key = objectKey(code)

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: png,
        ContentType: "image/png",
        CacheControl: "public, max-age=31536000, immutable",
        Metadata: {
          qrCode: code,
        },
      }),
    )

    const signedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ResponseContentType: "image/png",
        ResponseContentDisposition: `attachment; filename="${code}.png"`,
      }),
      { expiresIn: 3600 },
    )

    return NextResponse.json({
      path: key,
      publicUrl: signedUrl,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unable to upload QR image" },
      { status: 500 },
    )
  }
}
