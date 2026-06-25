"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import { X } from "lucide-react";
import { bulkMediaAction, updateMediaTagsAction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LabeledField } from "@/components/forms/labeled-field";

type MediaCategory = {
  id: string;
  name: string;
};

type MediaItem = {
  id: string;
  url: string;
  originalName: string;
  kind: "IMAGE" | "VIDEO" | "DOCUMENT";
  fileName: string;
  categoryId: string | null;
  categoryName: string | null;
  tags: string | null;
  width: number | null;
  height: number | null;
  size: number;
  storagePath: string;
};

type BulkOperation = "move" | "copy" | "delete";

export function MediaLibraryManager({
  media,
  categories
}: {
  media: MediaItem[];
  categories: MediaCategory[];
}) {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tagQuery, setTagQuery] = useState("");
  const [tagValues, setTagValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(media.map((item) => [item.id, item.tags ?? ""]))
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [operation, setOperation] = useState<BulkOperation>("move");
  const [targetCategoryId, setTargetCategoryId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setTagValues(Object.fromEntries(media.map((item) => [item.id, item.tags ?? ""])));
  }, [media]);

  const visibleMedia = useMemo(() => {
    const normalizedTag = tagQuery.trim().toLocaleLowerCase("tr-TR");
    return media.filter((item) => {
      const categoryMatches = !categoryFilter || item.categoryId === categoryFilter;
      const tagMatches = !normalizedTag || (tagValues[item.id] ?? "").toLocaleLowerCase("tr-TR").includes(normalizedTag);
      return categoryMatches && tagMatches;
    });
  }, [categoryFilter, media, tagQuery, tagValues]);

  const visibleIds = visibleMedia.map((item) => item.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  function toggleSelection(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleVisibleSelection() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function submitBulk(nextOperation: BulkOperation, categoryId?: string) {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    const formData = new FormData();
    formData.set("operation", nextOperation);
    if (categoryId !== undefined) formData.set("categoryId", categoryId);
    ids.forEach((id) => formData.append("mediaIds", id));
    startTransition(() => {
      void bulkMediaAction(formData).then(() => {
        setSelectedIds(new Set());
        setModalOpen(false);
      });
    });
  }

  function handleConfirm() {
    if (!selectedIds.size) return;
    if (operation === "delete") {
      if (window.confirm("Seçilen görseller silinecek. Devam etmek istiyor musunuz?")) {
        submitBulk("delete");
      }
      return;
    }
    setTargetCategoryId(categoryFilter);
    setModalOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <LabeledField label="Medya kategorisi" className="min-w-64">
          <select
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value);
              setSelectedIds(new Set());
            }}
            className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
          >
            <option value="">Tümü</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </LabeledField>
        <LabeledField label="Etiket ara" className="min-w-64 flex-1">
          <Input value={tagQuery} onChange={(event) => setTagQuery(event.target.value)} placeholder="Etikete göre ara" />
        </LabeledField>
        <Button type="button" variant="outline" onClick={toggleVisibleSelection}>
          {allVisibleSelected ? "Seçimi kaldır" : "Tümünü Seç"}
        </Button>
        <select
          value={operation}
          onChange={(event) => setOperation(event.target.value as BulkOperation)}
          className="h-10 min-w-52 rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="move">Seçilenleri Taşı</option>
          <option value="copy">Seçilenleri Kopyala</option>
          <option value="delete">Seçilenleri Sil</option>
        </select>
        <Button type="button" onClick={handleConfirm} disabled={!selectedIds.size || pending}>
          Onayla
        </Button>
      </div>

      {visibleMedia.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {visibleMedia.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
              <div className="relative">
                <button type="button" className="block w-full text-left" onClick={() => setPreviewItem(item)}>
                  {item.kind === "VIDEO" ? (
                    <video src={item.url} className="aspect-video w-full object-cover transition hover:opacity-85" muted playsInline />
                  ) : (
                    <Image
                      src={item.url}
                      alt={item.originalName}
                      width={420}
                      height={260}
                      className="aspect-video w-full object-cover transition hover:opacity-85"
                    />
                  )}
                </button>
                <input
                  aria-label="Görsel seç"
                  checked={selectedIds.has(item.id)}
                  onChange={() => toggleSelection(item.id)}
                  type="checkbox"
                  className="absolute left-3 top-3 h-5 w-5"
                />
              </div>
              <div className="p-3">
                <MediaTagInput
                  mediaId={item.id}
                  value={tagValues[item.id] ?? ""}
                  onValueChange={(nextValue) => {
                    setTagValues((current) => ({ ...current, [item.id]: nextValue }));
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted p-6 text-sm text-muted-foreground">
          Bu filtrelere uygun görsel bulunamadı.
        </div>
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-4 shadow-soft">
            <h3 className="font-semibold">
              {operation === "copy" ? "Seçilenleri Kopyala" : "Seçilenleri Taşı"}
            </h3>
            <LabeledField label="Kategori seç" className="mt-4">
              <select
                value={targetCategoryId}
                onChange={(event) => setTargetCategoryId(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              >
                <option value="">Kategorisiz</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </LabeledField>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Vazgeç
              </Button>
              <Button type="button" onClick={() => submitBulk(operation, targetCategoryId)} disabled={pending}>
                {operation === "copy" ? "Kopyala" : "Taşı"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {previewItem ? <MediaPreviewModal item={previewItem} onClose={() => setPreviewItem(null)} /> : null}
    </div>
  );
}

function MediaTagInput({
  mediaId,
  value,
  onValueChange
}: {
  mediaId: string;
  value: string;
  onValueChange: (value: string) => void;
}) {
  const [lastSaved, setLastSaved] = useState(value);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (value === lastSaved) return;
    const timeout = window.setTimeout(() => {
      const formData = new FormData();
      formData.set("id", mediaId);
      formData.set("tags", value);
      startTransition(() => {
        void updateMediaTagsAction(formData).then(() => setLastSaved(value));
      });
    }, 650);

    return () => window.clearTimeout(timeout);
  }, [lastSaved, mediaId, value]);

  return (
    <div className="space-y-1">
      <Input value={value} onChange={(event) => onValueChange(event.target.value)} placeholder="Etiket" />
      {pending ? <p className="text-xs text-muted-foreground">Kaydediliyor...</p> : null}
    </div>
  );
}

function MediaPreviewModal({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  const resolution = item.width && item.height ? `${item.width} x ${item.height}px` : "Bilinmiyor";

  return (
    <div className="fixed inset-0 z-50 bg-primary/60 p-4 backdrop-blur-sm">
      <Card className="mx-auto flex max-h-[92vh] max-w-6xl flex-col overflow-hidden p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold">{item.originalName}</h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">{item.url}</p>
          </div>
          <Button type="button" size="icon" variant="outline" onClick={onClose} aria-label="Kapat">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4 grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="relative min-h-[280px] overflow-hidden rounded-lg bg-muted">
            {item.kind === "VIDEO" ? (
              <video src={item.url} className="h-full w-full object-contain" controls autoPlay />
            ) : (
              <Image src={item.url} alt={item.originalName} fill className="object-contain" sizes="(min-width: 1024px) 70vw, 100vw" />
            )}
          </div>
          <div className="space-y-3 overflow-y-auto text-sm">
            <Info label="Kategori" value={item.categoryName ?? "Kategorisiz"} />
            <Info label="Etiket" value={item.tags || "-"} />
            <Info label="Çözünürlük" value={resolution} />
            <Info label="Dosya boyutu" value={formatBytes(item.size)} />
            <Info label="Dosya dizini" value={item.storagePath} />
            <Info label="Dosya adı" value={item.fileName} />
          </div>
        </div>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="font-medium">{label}</p>
      <p className="mt-1 break-words text-muted-foreground">{value}</p>
    </div>
  );
}

function formatBytes(size: number) {
  if (!Number.isFinite(size)) return "Bilinmiyor";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}
