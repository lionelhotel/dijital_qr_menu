"use client";

import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { useRef, useState, useTransition } from "react";
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
  const [pending, startTransition] = useTransition();

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
          showFlash("error", "Yüklenecek görsel seçin.");
          return;
        }

        startTransition(async () => {
          try {
            for (const file of files) {
              const formData = new FormData(form);
              formData.delete("files");
              formData.append("file", file);
              const response = await fetch("/api/upload", { method: "POST", body: formData });
              const data = (await response.json()) as { error?: string };
              if (!response.ok) throw new Error(data.error || `${file.name} yüklenemedi.`);
            }
            showFlash("success", `${files.length} görsel başarıyla yüklendi.`);
            setSelectedFiles([]);
            setNames([]);
            if (inputRef.current) inputRef.current.value = "";
            router.refresh();
          } catch (error) {
            showFlash("error", error instanceof Error ? error.message : "Görsel yüklenirken hata oluştu.");
          }
        });
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
        <p className="text-sm font-medium">Görselleri buraya bırakın veya seçin</p>
        <p className="text-xs text-muted-foreground">Toplu yükleme desteklenir. JPEG, PNG, WEBP, MP4, WEBM.</p>
        {names.length ? <p className="mt-2 text-xs text-muted-foreground">{names.length} dosya seçildi</p> : null}
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
        <LabeledField label="Hedef genişlik">
          <Input name="width" type="number" min={320} defaultValue={1600} />
        </LabeledField>
        <LabeledField label="Hedef yükseklik">
          <Input name="height" type="number" min={0} placeholder="Boş bırakılabilir" />
        </LabeledField>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Yükleniyor" : "Görselleri yükle"}</Button>
    </form>
  );
}

function showFlash(type: "success" | "error" | "info", message: string) {
  const flash = { type, message, createdAt: Date.now() };
  document.cookie = `admin_flash=${encodeURIComponent(JSON.stringify(flash))}; path=/; max-age=30; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent("admin-flash", { detail: flash }));
}
