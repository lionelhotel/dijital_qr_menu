"use client";

import Image from "next/image";
import { useState } from "react";
import { Download, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function QrTool() {
  const [target, setTarget] = useState("/tr/menu?location=lobby-bar");
  const [dataUrl, setDataUrl] = useState("");

  async function generate() {
    const response = await fetch(`/api/qr?target=${encodeURIComponent(target)}`);
    const data = (await response.json()) as { dataUrl: string };
    setDataUrl(data.dataUrl);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        <Input value={target} onChange={(event) => setTarget(event.target.value)} placeholder="Hedef URL" />
        <Button type="button" onClick={generate}>
          <QrCode className="h-4 w-4" />
          QR üret
        </Button>
      </div>
      <div className="flex min-h-80 items-center justify-center rounded-lg border border-border bg-card p-4">
        {dataUrl ? (
          <a href={dataUrl} download="qr-menu.png" className="block text-center">
            <Image src={dataUrl} alt="QR kod" width={256} height={256} unoptimized className="mx-auto h-64 w-64" />
            <span className="mt-3 inline-flex items-center gap-2 text-sm font-medium">
              <Download className="h-4 w-4" />
              PNG indir
            </span>
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">QR kod burada görünecek.</p>
        )}
      </div>
    </div>
  );
}
