import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ fileName: string }> }
) {
  const { fileName } = await context.params;
  if (!/^[a-f0-9-]+\.webp$/i.test(fileName)) {
    return NextResponse.json({ error: "Geçersiz dosya." }, { status: 400 });
  }

  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? "./storage/uploads");
  const file = await readFile(path.join(uploadDir, fileName));
  return new NextResponse(file, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
