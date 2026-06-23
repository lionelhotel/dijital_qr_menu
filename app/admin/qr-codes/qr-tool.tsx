"use client";

import Image from "next/image";
import { useState } from "react";
import { Download, QrCode, Save } from "lucide-react";
import { LabeledField } from "@/components/forms/labeled-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function QrTool({
  action
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const [name, setName] = useState("Restaurant Menu");
  const [target, setTarget] = useState("/tr/menu");
  const [location, setLocation] = useState("");
  const [dataUrl, setDataUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const response = await fetch(`/api/qr?target=${encodeURIComponent(target)}`);
      const data = (await response.json()) as { dataUrl?: string; error?: string };
      if (data.dataUrl) setDataUrl(data.dataUrl);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <form action={action} className="grid gap-3 md:grid-cols-2">
        <LabeledField label="QR kod adı">
          <Input name="name" value={name} onChange={(event) => setName(event.target.value)} required />
        </LabeledField>
        <LabeledField label="Konum">
          <Input name="location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Lobby, oda, masa vb." />
        </LabeledField>
        <LabeledField label="Hedef URL" className="md:col-span-2">
          <Input name="targetUrl" value={target} onChange={(event) => setTarget(event.target.value)} required />
        </LabeledField>
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <Button type="button" variant="outline" onClick={generate} disabled={loading || !target}>
            <QrCode className="h-4 w-4" />
            QR üret
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4" />
            Kaydet
          </Button>
        </div>
      </form>
      <div className="flex min-h-80 items-center justify-center rounded-lg border border-border bg-card p-4">
        {dataUrl ? (
          <a href={dataUrl} download={`${slugifyFileName(name || "qr-kod")}.png`} className="block text-center">
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

function slugifyFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
