import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function storeImage(file: File) {
  const maxMb = Number(process.env.MAX_UPLOAD_MB ?? 4);
  if (!allowedTypes.has(file.type)) {
    throw new Error("Desteklenmeyen dosya tipi.");
  }
  if (file.size > maxMb * 1024 * 1024) {
    throw new Error(`Dosya ${maxMb} MB sınırını aşıyor.`);
  }

  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? "./storage/uploads");
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const image = sharp(buffer).rotate().resize({ width: 1600, withoutEnlargement: true });
  const metadata = await image.metadata();
  const fileName = `${randomUUID()}.webp`;
  const target = path.join(uploadDir, fileName);
  await writeFile(target, await image.webp({ quality: 82 }).toBuffer());

  return {
    fileName,
    mimeType: "image/webp",
    size: file.size,
    width: metadata.width,
    height: metadata.height,
    url: `/api/media/${fileName}`
  };
}
