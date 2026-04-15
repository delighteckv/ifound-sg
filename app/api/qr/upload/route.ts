import { NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import outputs from "@/amplify_outputs.json"

const region = outputs.storage.aws_region
const bucket = outputs.storage.bucket_name
const s3 = new S3Client({ region })

function objectKey(code: string) {
  return `public/qr-codes/${code}.png`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const code = String(body?.code || "").trim()
    const payload = String(body?.payload || "").trim()

    if (!code || !payload) {
      return NextResponse.json({ error: "code and payload are required" }, { status: 400 })
    }

    const png = await QRCode.toBuffer(payload, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 1024,
      color: {
        dark: "#111827",
        light: "#FFFFFF",
      },
    })

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
