"use client";

import Image from "next/image";
import { useState } from "react";
import { Download, Eye, Trash2 } from "lucide-react";
import { deleteQrCodeAction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";

type QrCodeItem = {
  id: string;
  name: string;
  targetUrl: string;
  location: string | null;
  scanCount: number;
};

export function QrCodeList({ codes }: { codes: QrCodeItem[] }) {
  const [preview, setPreview] = useState<(QrCodeItem & { dataUrl?: string }) | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function openPreview(code: QrCodeItem) {
    setLoadingId(code.id);
    try {
      const response = await fetch(`/api/qr?target=${encodeURIComponent(code.targetUrl)}`);
      const data = (await response.json()) as { dataUrl?: string };
      setPreview({ ...code, dataUrl: data.dataUrl });
    } finally {
      setLoadingId(null);
    }
  }

  if (!codes.length) {
    return <div className="p-6 text-sm text-muted-foreground">Henüz kayıtlı QR kod yok.</div>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-3">Ad</th>
              <th className="p-3">Hedef</th>
              <th className="p-3">Konum</th>
              <th className="p-3">Tarama</th>
              <th className="p-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((code) => (
              <tr
                key={code.id}
                className="border-t border-border hover:bg-muted/50"
              >
                <td className="p-3">
                  <button type="button" onClick={() => openPreview(code)} className="font-medium hover:underline">
                    {code.name}
                  </button>
                </td>
                <td className="max-w-md truncate p-3 text-muted-foreground">{code.targetUrl}</td>
                <td className="p-3 text-muted-foreground">{code.location ?? "-"}</td>
                <td className="p-3">{code.scanCount}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => openPreview(code)} disabled={loadingId === code.id}>
                      <Eye className="h-4 w-4" />
                      Önizle
                    </Button>
                    <form action={deleteQrCodeAction}>
                      <input type="hidden" name="id" value={code.id} />
                      <Button type="submit" size="sm" variant="outline">
                        <Trash2 className="h-4 w-4" />
                        Sil
                      </Button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-semibold">{preview.name}</h3>
                <p className="mt-1 truncate text-sm text-muted-foreground">{preview.targetUrl}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setPreview(null)}>
                Kapat
              </Button>
            </div>
            <div className="mt-4 flex min-h-72 items-center justify-center rounded-lg border border-border bg-white p-4">
              {preview.dataUrl ? (
                <Image src={preview.dataUrl} alt={preview.name} width={280} height={280} unoptimized className="h-72 w-72" />
              ) : (
                <p className="text-sm text-muted-foreground">QR kod hazırlanıyor...</p>
              )}
            </div>
            {preview.dataUrl ? (
              <a
                href={preview.dataUrl}
                download={`${slugifyFileName(preview.name)}.png`}
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                <Download className="h-4 w-4" />
                PNG indir
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function slugifyFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "qr-kod";
}
