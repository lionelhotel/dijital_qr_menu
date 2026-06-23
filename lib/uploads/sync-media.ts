import "server-only";

import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { prisma } from "@/lib/database/prisma";

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export async function syncStorageMedia() {
  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? "./storage/uploads");
  let files: string[] = [];
  try {
    files = await readdir(uploadDir);
  } catch {
    return;
  }

  const existing = await prisma.media.findMany({
    where: { fileName: { in: files } },
    select: { fileName: true }
  });
  const known = new Set(existing.map((item) => item.fileName));

  for (const fileName of files) {
    if (known.has(fileName) || !allowedExtensions.has(path.extname(fileName).toLowerCase())) continue;
    const filePath = path.join(uploadDir, fileName);
    const [info, metadata] = await Promise.all([
      stat(filePath),
      sharp(filePath).metadata().catch(() => null)
    ]);
    await prisma.media.create({
      data: {
        kind: "IMAGE",
        originalName: fileName,
        fileName,
        mimeType: metadata?.format === "png" ? "image/png" : metadata?.format === "jpeg" ? "image/jpeg" : "image/webp",
        size: info.size,
        width: metadata?.width,
        height: metadata?.height,
        url: `/api/media/${fileName}`
      }
    });
  }
}
