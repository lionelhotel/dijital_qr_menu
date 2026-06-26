"use client";

import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LabeledField } from "@/components/forms/labeled-field";

export function MediaUploadForm({
  categories
}: {
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [names, setNames] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  function readFiles(files: FileList | null) {
    const nextFiles = Array.from(files ?? []);
    setSelectedFiles(nextFiles);
    setNames(nextFiles.map((file) => file.name));
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const files = selectedFiles.length ? selectedFiles : Array.from(inputRef.current?.files ?? []);
        if (!files.length) {
          showFlash("error", "Yuklenecek medya secin.");
          return;
        }

        setUploading(true);
        setProgress(0);
        void (async () => {
          try {
            for (const [index, file] of files.entries()) {
              const formData = new FormData(form);
              formData.delete("files");
              formData.append("file", file);
              await uploadWithProgress(formData, (percent) => {
                setProgress(Math.round(((index + percent / 100) / files.length) * 100));
              });
            }
            showFlash("success", `${files.length} medya basariyla yuklendi.`);
            setSelectedFiles([]);
            setNames([]);
            if (inputRef.current) inputRef.current.value = "";
            router.refresh();
          } catch (error) {
            showFlash("error", error instanceof Error ? error.message : "Medya yuklenirken hata olustu.");
          } finally {
            setUploading(false);
          }
        })();
      }}
      className="grid gap-3 xl:grid-cols-[minmax(280px,1fr)_minmax(360px,1fr)_auto] xl:items-end"
    >
      <div
        className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted p-4 text-center xl:min-h-24"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          readFiles(event.dataTransfer.files);
        }}
      >
        <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium">Gorselleri veya videolari buraya birakin ya da secin</p>
        <p className="text-xs text-muted-foreground">Toplu yukleme desteklenir. JPEG, PNG, WEBP, MP4, WEBM, MOV.</p>
        {names.length ? <p className="mt-2 text-xs text-muted-foreground">{names.length} dosya secildi</p> : null}
        {uploading ? <ProgressBar value={progress} /> : null}
      </div>
      <input
        ref={inputRef}
        name="files"
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
        multiple
        className="hidden"
        onChange={(event) => readFiles(event.target.files)}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <LabeledField label="Medya kategorisi">
          <select name="categoryId" className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm">
            <option value="">Kategorisiz</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </LabeledField>
        <LabeledField label="Hedef genislik">
          <Input name="width" type="number" min={320} defaultValue={1600} />
        </LabeledField>
        <LabeledField label="Hedef yukseklik">
          <Input name="height" type="number" min={0} placeholder="Bos birakilabilir" />
        </LabeledField>
      </div>
      <Button type="submit" disabled={uploading}>{uploading ? `Yukleniyor %${progress}` : "Medya yukle"}</Button>
    </form>
  );
}

function uploadWithProgress(formData: FormData, onProgress: (percent: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/upload");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      }
    };
    request.onload = () => {
      let data: { error?: string } = {};
      try {
        data = JSON.parse(request.responseText || "{}") as { error?: string };
      } catch {
        data = {};
      }
      if (request.status >= 200 && request.status < 300) {
        onProgress(100);
        resolve();
        return;
      }
      reject(new Error(data.error || "Medya yuklenemedi."));
    };
    request.onerror = () => reject(new Error("Medya yuklenemedi."));
    request.send(formData);
  });
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-3 w-full max-w-sm">
      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
        <span>Yukleniyor</span>
        <span>%{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-background">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function showFlash(type: "success" | "error" | "info", message: string) {
  const flash = { type, message, createdAt: Date.now() };
  document.cookie = `admin_flash=${encodeURIComponent(JSON.stringify(flash))}; path=/; max-age=30; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent("admin-flash", { detail: flash }));
}
