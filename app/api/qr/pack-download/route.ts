import { NextRequest, NextResponse } from "next/server"
import { ImageResponse } from "next/og"
import { createElement } from "react"
import QRCode from "qrcode"

type PackCode = {
  code: string
  position?: number | null
}

const PAGE_WIDTH = 1600
const PAGE_HEIGHT = 2200
const BACKGROUND = "#FFFFFF"
const FOREGROUND = "#111111"
const ACCENT = "#39FF14"

async function qrDataUrl(payload: string, width = 280) {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "H",
    margin: 1,
    width,
    color: {
      dark: FOREGROUND,
      light: "#FFFFFF",
    },
  })
}

function chunk<T>(items: T[], size: number) {
  const groups: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size))
  }
  return groups
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const packId = String(body?.packId || "").trim().toUpperCase()
    const baseUrl = String(body?.baseUrl || "").trim().replace(/\/$/, "")
    const codes = Array.isArray(body?.codes) ? (body.codes as PackCode[]) : []

    if (!packId || !baseUrl || !codes.length) {
      return NextResponse.json({ error: "packId, baseUrl, and codes are required" }, { status: 400 })
    }

    const packQr = await qrDataUrl(packId, 320)
    const codeQrs = await Promise.all(
      codes.map(async (item) => ({
        code: String(item.code || "").trim().toUpperCase(),
        position: item.position || null,
        qr: await qrDataUrl(`${baseUrl}/found/${encodeURIComponent(String(item.code || "").trim().toUpperCase())}`, 240),
      })),
    )

    const rows = chunk(codeQrs, 2)

    const response = new ImageResponse(
      createElement(
        "div",
        {
          style: {
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
            display: "flex",
            flexDirection: "column",
            background: BACKGROUND,
            color: FOREGROUND,
            padding: 60,
            fontFamily: "Arial",
          },
        },
        createElement(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0 0 30px 0",
              borderBottom: "4px solid #111111",
            },
          },
          createElement(
            "div",
            { style: { display: "flex", flexDirection: "column", gap: 8 } },
            createElement("div", { style: { fontSize: 72, fontWeight: 900, color: FOREGROUND } }, "iFound Pack"),
            createElement("div", { style: { fontSize: 42, fontWeight: 700 } }, packId),
            createElement("div", { style: { fontSize: 24, color: "#555555" } }, `${codes.length} QR codes in this pack`),
          ),
          createElement(
            "div",
            {
              style: {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
                padding: 20,
                border: `6px solid ${ACCENT}`,
                borderRadius: 24,
              },
            },
            createElement("img", { src: packQr, width: "320", height: "320", alt: `Pack ${packId}` }),
            createElement("div", { style: { fontSize: 28, fontWeight: 800 } }, "Pack Claim QR"),
            createElement("div", { style: { fontSize: 20, color: "#555555" } }, "Scan or enter this pack ID to claim"),
          ),
        ),
        createElement(
          "div",
          {
            style: {
              marginTop: 36,
              display: "flex",
              flexDirection: "column",
              gap: 24,
              flex: 1,
            },
          },
          ...rows.map((row, rowIndex) =>
            createElement(
              "div",
              {
                key: `row-${rowIndex}`,
                style: {
                  display: "flex",
                  gap: 24,
                  width: "100%",
                },
              },
              ...row.map((item) =>
                createElement(
                  "div",
                  {
                    key: item.code,
                    style: {
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "space-between",
                      border: "3px solid #111111",
                      borderRadius: 24,
                      padding: 24,
                      minHeight: 320,
                      background: "#FAFAFA",
                    },
                  },
                  createElement("div", { style: { fontSize: 22, fontWeight: 900, color: FOREGROUND } }, item.code),
                  createElement("img", { src: item.qr, width: "240", height: "240", alt: item.code }),
                  createElement(
                    "div",
                    { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 } },
                    createElement("div", { style: { fontSize: 18, fontWeight: 700 } }, `Position ${item.position || "—"}`),
                    createElement("div", { style: { fontSize: 16, color: "#555555" } }, "Scan to contact owner"),
                  ),
                ),
              ),
              row.length === 1
                ? createElement("div", { key: `spacer-${rowIndex}`, style: { flex: 1 } })
                : null,
            ),
          ),
        ),
      ),
      {
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
      },
    )

    return new NextResponse(Buffer.from(await response.arrayBuffer()), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${packId}.png"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unable to generate pack sheet" }, { status: 500 })
  }
}
