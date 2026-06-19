import { NextResponse } from "next/server";
import { createQrPngDataUrl, createQrSvg } from "@/lib/qr/qr";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const target = url.searchParams.get("target");
  const format = url.searchParams.get("format") ?? "png";

  if (!target) {
    return NextResponse.json({ error: "target parametresi gerekli." }, { status: 400 });
  }

  if (format === "svg") {
    return new NextResponse(await createQrSvg(target), {
      headers: { "Content-Type": "image/svg+xml" }
    });
  }

  return NextResponse.json({ dataUrl: await createQrPngDataUrl(target) });
}
