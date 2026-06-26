import { open, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ fileName: string }> }
) {
  const { fileName } = await context.params;
  if (!/^[a-f0-9-]+\.(webp|mp4|webm|mov)$/i.test(fileName)) {
    return NextResponse.json({ error: "Gecersiz dosya." }, { status: 400 });
  }

  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? "./storage/uploads");
  const filePath = path.join(uploadDir, fileName);

  try {
    const fileStat = await stat(filePath);
    const type = contentType(fileName);
    const range = request.headers.get("range");

    if (range && type.startsWith("video/")) {
      const partial = parseRange(range, fileStat.size);
      if (!partial) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            "Accept-Ranges": "bytes",
            "Content-Range": `bytes */${fileStat.size}`
          }
        });
      }

      const body = await readChunk(filePath, partial.start, partial.end);
      return new NextResponse(body, {
        status: 206,
        headers: {
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=31536000, immutable",
          "Content-Length": String(body.byteLength),
          "Content-Range": `bytes ${partial.start}-${partial.end}/${fileStat.size}`,
          "Content-Type": type
        }
      });
    }

    const body = await readFile(filePath);
    return new NextResponse(body, {
      headers: {
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(fileStat.size),
        "Content-Type": type
      }
    });
  } catch {
    return NextResponse.json({ error: "Dosya bulunamadi." }, { status: 404 });
  }
}

async function readChunk(filePath: string, start: number, end: number) {
  const length = end - start + 1;
  const file = await open(filePath, "r");
  try {
    const buffer = Buffer.alloc(length);
    const result = await file.read(buffer, 0, length, start);
    return result.bytesRead === length ? buffer : buffer.subarray(0, result.bytesRead);
  } finally {
    await file.close();
  }
}

function parseRange(range: string, size: number) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!match) return null;

  const [, rawStart, rawEnd] = match;
  if (!rawStart && !rawEnd) return null;

  if (!rawStart) {
    const suffixLength = Number(rawEnd);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null;
    return {
      start: Math.max(size - suffixLength, 0),
      end: size - 1
    };
  }

  const start = Number(rawStart);
  const end = rawEnd ? Number(rawEnd) : size - 1;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start >= size) {
    return null;
  }

  return {
    start,
    end: Math.min(end, size - 1)
  };
}

function contentType(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mov")) return "video/quicktime";
  return "image/webp";
}
