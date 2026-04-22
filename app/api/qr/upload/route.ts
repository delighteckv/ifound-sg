import { NextRequest, NextResponse } from "next/server"
import { ImageResponse } from "next/og"
import { createElement } from "react"
import QRCode from "qrcode"
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import outputs from "@/amplify_outputs.json"

const region = outputs.storage.aws_region
const bucket = outputs.storage.bucket_name
const s3 = new S3Client({ region })

const STICKER_WIDTH = 1024
const STICKER_HEIGHT = 1024
const BACKGROUND = "#8CFF1A"
const FOREGROUND = "#111111"
const WEBSITE = "ifound.sg"
const TAGLINE = ["Prevent item loss", "with QR code stickers", "powered by kindness"]

function objectKey(code: string) {
  return `public/qr-codes/${code}.png`
}

async function createSticker(code: string, payload: string) {
  const qrDataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 460,
    color: {
      dark: FOREGROUND,
      light: "#FFFFFF",
    },
  })

  const response = new ImageResponse(
    createElement(
      "div",
      {
        style: {
          width: STICKER_WIDTH,
          height: STICKER_HEIGHT,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          background: BACKGROUND,
          color: FOREGROUND,
          borderRadius: 54,
          overflow: "hidden",
          padding: 60,
          fontFamily: "Arial",
        },
      },
      createElement("div", {
        style: {
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(180deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 8px)",
          opacity: 0.55,
        },
      }),
      createElement(
        "div",
        { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", zIndex: 1 } },
        createElement(
          "div",
          { style: { display: "flex", alignItems: "center", fontSize: 170, fontWeight: 900, lineHeight: 1 } },
          createElement("span", null, "iFound"),
        ),
        createElement(
          "div",
          {
            style: {
              marginTop: 8,
              width: 74,
              height: 74,
              borderRadius: 999,
              border: `9px solid ${FOREGROUND}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              fontWeight: 900,
            },
          },
          "R",
        ),
      ),
      createElement(
        "div",
        { style: { display: "flex", marginTop: 120, gap: 56, zIndex: 1 } },
        createElement(
          "div",
          { style: { display: "flex", flexDirection: "column", width: 460 } },
          createElement("img", { src: qrDataUrl, width: "460", height: "460", alt: "QR code" }),
          createElement(
            "div",
            { style: { display: "flex", justifyContent: "center", marginTop: -10, fontSize: 84, fontWeight: 900 } },
            "iFound",
          ),
        ),
        createElement(
          "div",
          { style: { display: "flex", flexDirection: "column", flex: 1, paddingTop: 24 } },
          createElement(
            "div",
            { style: { display: "flex", flexDirection: "column", fontSize: 58, fontWeight: 800, lineHeight: 1.1 } },
            ...TAGLINE.map((line) => createElement("span", { key: line }, line)),
          ),
          createElement(
            "div",
            {
              style: {
                marginTop: 64,
                width: 132,
                height: 132,
                borderRadius: 999,
                border: `11px solid ${FOREGROUND}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 92,
                fontWeight: 900,
              },
            },
            "R",
          ),
          createElement("div", { style: { marginTop: 42, fontSize: 72, fontWeight: 900 } }, WEBSITE),
        ),
      ),
      createElement(
        "div",
        { style: { marginTop: 34, zIndex: 1, display: "flex", flexDirection: "column", gap: 8 } },
        createElement("div", { style: { fontSize: 42, fontWeight: 900 } }, `Code ${code}`),
        createElement("div", { style: { fontSize: 32, fontWeight: 500 } }, "Scan to contact the owner securely"),
      ),
    ),
    {
      width: STICKER_WIDTH,
      height: STICKER_HEIGHT,
    },
  )

  return Buffer.from(await response.arrayBuffer())
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
