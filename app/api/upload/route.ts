import { NextResponse } from "next/server";
import { AuditAction } from "@prisma/client";
import { audit } from "@/lib/audit/audit";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { storeUploadedMedia } from "@/lib/uploads/images";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireAdmin();
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Dosya bulunamadi." }, { status: 400 });
    }

    const width = Number(formData.get("width") || 1600);
    const heightValue = String(formData.get("height") || "");
    const stored = await storeUploadedMedia(file, {
      width: Number.isFinite(width) ? width : 1600,
      height: heightValue ? Number(heightValue) : undefined
    });
    const media = await prisma.media.create({
      data: {
        kind: stored.kind,
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
  } catch (error) {
    console.error("API media upload failed", error);
    const message = error instanceof Error ? error.message : "Medya yuklenemedi.";
    const status = /MB|sinir|sınır/i.test(message) ? 413 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
