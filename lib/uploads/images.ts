import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const allowedVideoTypes = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const imageMaxMb = Number(process.env.MAX_IMAGE_UPLOAD_MB ?? process.env.MAX_UPLOAD_MB ?? 25);
const videoMaxMb = Number(process.env.MAX_VIDEO_UPLOAD_MB ?? process.env.MAX_UPLOAD_MB ?? 200);

export async function storeImage(file: File, options: { width?: number; height?: number } = {}) {
  if (!allowedTypes.has(file.type)) {
    throw new Error("Desteklenmeyen dosya tipi.");
  }
  if (file.size > imageMaxMb * 1024 * 1024) {
    throw new Error(`Dosya ${imageMaxMb} MB sinirini asiyor.`);
  }

  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? "./storage/uploads");
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const image = sharp(buffer)
    .rotate()
    .resize({
      width: options.width ?? 1600,
      height: options.height,
      fit: options.height ? "cover" : "inside",
      withoutEnlargement: true
    });
  const fileName = `${randomUUID()}.webp`;
  const target = path.join(uploadDir, fileName);
  const output = await image.webp({ quality: 82 }).toBuffer();
  const metadata = await sharp(output).metadata();
  await writeFile(target, output);

  return {
    fileName,
    mimeType: "image/webp",
    size: output.byteLength,
    width: metadata.width,
    height: metadata.height,
    url: `/api/media/${fileName}`
  };
}

export async function storeUploadedMedia(file: File, options: { width?: number; height?: number } = {}) {
  if (allowedTypes.has(file.type)) {
    const image = await storeImage(file, options);
    return { ...image, kind: "IMAGE" as const };
  }

  if (!allowedVideoTypes.has(file.type)) {
    throw new Error("Desteklenmeyen dosya tipi.");
  }
  if (file.size > videoMaxMb * 1024 * 1024) {
    throw new Error(`Video ${videoMaxMb} MB sinirini asiyor.`);
  }

  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? "./storage/uploads");
  await mkdir(uploadDir, { recursive: true });

  const extension = videoExtension(file.type);
  const fileName = `${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, fileName), buffer);

  return {
    kind: "VIDEO" as const,
    fileName,
    mimeType: file.type,
    size: buffer.byteLength,
    width: undefined,
    height: undefined,
    url: `/api/media/${fileName}`
  };
}

function videoExtension(mimeType: string) {
  if (mimeType === "video/webm") return "webm";
  if (mimeType === "video/quicktime") return "mov";
  return "mp4";
}
