"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImageIcon, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LabeledField } from "@/components/forms/labeled-field";

type MediaCategory = {
  id?: string;
  name: string;
};

type MediaItem = {
  id: string;
  url: string;
  originalName: string;
  kind?: "IMAGE" | "VIDEO" | "DOCUMENT";
  categoryId?: string | null;
  category?: MediaCategory | null;
  tags?: string | null;
  width?: number | null;
  height?: number | null;
  size?: number;
  fileName?: string;
};

export function MediaPickerField({
  name,
  defaultValue,
  media,
  categories = [],
  label = "Medya arsivinden sec",
  targetWidth = 1600,
  targetHeight
}: {
  name: string;
  defaultValue?: string | null;
  media: MediaItem[];
  categories?: MediaCategory[];
  label?: string;
  targetWidth?: number;
  targetHeight?: number;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [items, setItems] = useState(media);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [categoryId, setCategoryId] = useState("");
  const [libraryCategoryId, setLibraryCategoryId] = useState("");
  const [tagQuery, setTagQuery] = useState("");
  const [width, setWidth] = useState(String(targetWidth));
  const [height, setHeight] = useState(targetHeight ? String(targetHeight) : "");
  const fileRef = useRef<HTMLInputElement>(null);
  const selectedItem = items.find((item) => item.url === value);
  const selectedIsVideo = isVideoMedia(selectedItem);

  const visibleItems = items.filter((item) => {
    const itemCategoryId = item.categoryId ?? item.category?.id ?? "";
    const categoryMatches = !libraryCategoryId || itemCategoryId === libraryCategoryId;
    const tagMatches = !tagQuery.trim() || (item.tags ?? "").toLocaleLowerCase("tr-TR").includes(tagQuery.trim().toLocaleLowerCase("tr-TR"));
    return categoryMatches && tagMatches;
  });

  async function uploadSelectedFiles(files: FileList | null) {
    const selected = Array.from(files ?? []);
    if (!selected.length) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      const uploaded: MediaItem[] = [];
      for (const [index, file] of selected.entries()) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("categoryId", categoryId);
        formData.append("width", width || String(targetWidth));
        formData.append("height", height);
        const data = await uploadWithProgress(formData, (percent) => {
          setUploadProgress(Math.round(((index + percent / 100) / selected.length) * 100));
        });
        uploaded.push({
          ...data,
          categoryId,
          category: categories.find((category) => category.id === categoryId) ?? null
        });
      }
      setItems((current) => [...uploaded, ...current]);
      if (uploaded[0]) setValue(uploaded[0].url);
      showFlash("success", `${uploaded.length} medya arsivine yuklendi.`);
    } catch (error) {
      showFlash("error", error instanceof Error ? error.message : "Medya yuklenirken hata olustu.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block aspect-video w-full max-w-sm overflow-hidden rounded-lg border border-border bg-muted text-left"
      >
        {value ? (
          selectedIsVideo ? (
            <video src={value} className="h-full w-full object-cover transition group-hover:opacity-80" muted playsInline />
          ) : (
            <Image src={value} alt={label} fill className="object-cover transition group-hover:opacity-80" />
          )
        ) : (
          <span className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
            {label}
          </span>
        )}
      </button>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          <ImageIcon className="h-4 w-4" />
          Medya arsivi
        </Button>
        {value ? (
          <Button type="button" variant="outline" onClick={() => setValue("")}>
            <Trash2 className="h-4 w-4" />
            Gorseli temizle
          </Button>
        ) : null}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 bg-primary/60 p-4 backdrop-blur-sm">
          <div className="mx-auto flex max-h-[92vh] max-w-6xl flex-col overflow-hidden rounded-lg bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="font-semibold">{label}</h2>
              <Button type="button" size="icon" variant="outline" onClick={() => setOpen(false)} aria-label="Kapat">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="border-b border-border p-4">
              <div
                className="rounded-lg border border-dashed border-border bg-muted p-4"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  void uploadSelectedFiles(event.dataTransfer.files);
                }}
              >
                <div className="grid gap-3 lg:grid-cols-[1fr_180px_140px_140px_auto]">
                  <button
                    type="button"
                    className="flex min-h-20 items-center justify-center gap-2 rounded-md bg-card px-3 text-sm"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Medya sec veya buraya birak
                  </button>
                  <LabeledField label="Kategori">
                    <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm">
                      <option value="">Kategorisiz</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </LabeledField>
                  <LabeledField label="Genislik">
                    <Input value={width} onChange={(event) => setWidth(event.target.value)} type="number" min={320} />
                  </LabeledField>
                  <LabeledField label="Yukseklik">
                    <Input value={height} onChange={(event) => setHeight(event.target.value)} type="number" min={0} />
                  </LabeledField>
                  <div className="flex items-end">
                    <Button type="button" disabled={uploading} onClick={() => fileRef.current?.click()}>
                      {uploading ? `Yukleniyor %${uploadProgress}` : "Yukle"}
                    </Button>
                  </div>
                </div>
                {uploading ? <ProgressBar value={uploadProgress} /> : null}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                  multiple
                  className="hidden"
                  onChange={(event) => void uploadSelectedFiles(event.target.files)}
                />
              </div>
            </div>

            <div className="border-b border-border p-4">
              <div className="grid gap-3 md:grid-cols-[240px_minmax(0,1fr)]">
                <LabeledField label="Medya kategorisi">
                  <select
                    value={libraryCategoryId}
                    onChange={(event) => setLibraryCategoryId(event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                  >
                    <option value="">Tumu</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </LabeledField>
                <LabeledField label="Etiket ara">
                  <Input value={tagQuery} onChange={(event) => setTagQuery(event.target.value)} placeholder="Etikete gore ara" />
                </LabeledField>
              </div>
            </div>

            <div className="grid gap-3 overflow-y-auto p-4 sm:grid-cols-2 lg:grid-cols-4">
              {visibleItems.length ? (
                visibleItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setValue(item.url);
                      setOpen(false);
                    }}
                    className="overflow-hidden rounded-lg border border-border text-left transition hover:border-accent"
                  >
                    <div className="relative aspect-video bg-muted">
                      {isVideoMedia(item) ? (
                        <video src={item.url} className="h-full w-full object-cover" muted playsInline />
                      ) : (
                        <Image src={item.url} alt={item.originalName} fill className="object-cover" />
                      )}
                    </div>
                    <div className="p-2 text-xs">
                      <p className="truncate text-muted-foreground">{item.tags || "Etiket yok"}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-lg border border-border bg-muted p-6 text-sm text-muted-foreground sm:col-span-2 lg:col-span-4">
                  Bu filtrelere uygun medya bulunamadi.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function isVideoMedia(item?: MediaItem) {
  if (!item) return false;
  return item.kind === "VIDEO" || /\.(mp4|webm|mov)$/i.test(item.url);
}

function uploadWithProgress(formData: FormData, onProgress: (percent: number) => void) {
  return new Promise<MediaItem>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/upload");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      }
    };
    request.onload = () => {
      let data: (MediaItem & { error?: string }) | { error?: string } = {};
      try {
        data = JSON.parse(request.responseText || "{}") as MediaItem & { error?: string };
      } catch {
        data = {};
      }
      if (request.status >= 200 && request.status < 300 && "url" in data) {
        onProgress(100);
        resolve(data);
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
    <div className="mt-3">
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
