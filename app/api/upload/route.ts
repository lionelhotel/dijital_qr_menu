import { NextResponse } from "next/server";
import { AuditAction } from "@prisma/client";
import { audit } from "@/lib/audit/audit";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { storeImage } from "@/lib/uploads/images";

export async function POST(request: Request) {
  const user = await requireAdmin();
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
  }

  const width = Number(formData.get("width") || 1600);
  const heightValue = String(formData.get("height") || "");
  const stored = await storeImage(file, {
    width: Number.isFinite(width) ? width : 1600,
    height: heightValue ? Number(heightValue) : undefined
  });
  const media = await prisma.media.create({
    data: {
      kind: "IMAGE",
      categoryId: String(formData.get("categoryId") || "") || null,
      originalName: file.name,
      fileName: stored.fileName,
      mimeType: stored.mimeType,
      size: stored.size,
      width: stored.width,
      height: stored.height,
      url: stored.url,
      createdBy: user.id
    }
  });

  await audit({
    userId: user.id,
    action: AuditAction.CREATE,
    resourceType: "Media",
    resourceId: media.id,
    newValue: { fileName: media.fileName, mimeType: media.mimeType }
  });

  return NextResponse.json(media);
}
