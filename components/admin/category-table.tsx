"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { Eye, GripVertical, Pencil, Trash2, X } from "lucide-react";
import { deleteCategoryAction, updateCategoryAction, updateSortOrderAction } from "@/lib/admin/actions";
import { CategoryForm, type CategoryFormCategory } from "@/components/admin/category-form";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type MediaItem = { id: string; url: string; originalName: string; category: { name: string } | null };
type MediaCategory = { id: string; name: string };

export type CategoryTableRow = CategoryFormCategory & {
  parentName: string | null;
  productCount: number;
  childCount: number;
};

export function CategoryTable({
  categories,
  categoryOptions,
  media,
  mediaCategories
}: {
  categories: CategoryTableRow[];
  categoryOptions: CategoryFormCategory[];
  media: MediaItem[];
  mediaCategories: MediaCategory[];
}) {
  const [orderedCategories, setOrderedCategories] = useState(categories);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [viewCategory, setViewCategory] = useState<CategoryTableRow | null>(null);
  const [editCategory, setEditCategory] = useState<CategoryTableRow | null>(null);
  const [savedOrder, setSavedOrder] = useState(() => categories.map((category) => category.id).join(","));
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setOrderedCategories(categories);
    setSavedOrder(categories.map((category) => category.id).join(","));
  }, [categories]);

  function moveCategory(targetId: string) {
    if (!draggedId || draggedId === targetId) return;
    setOrderedCategories((current) => {
      const next = [...current];
      const from = next.findIndex((category) => category.id === draggedId);
      const to = next.findIndex((category) => category.id === targetId);
      if (from < 0 || to < 0) return current;
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function saveCategoryOrder() {
    const ids = orderedCategories.map((category) => category.id).join(",");
    if (!ids || ids === savedOrder) return;

    const formData = new FormData();
    formData.set("type", "category");
    formData.set("ids", ids);
    setSavedOrder(ids);
    startTransition(() => {
      void updateSortOrderAction(formData);
    });
  }

  return (
    <>
      <Card className="p-4">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Kategori listesi</h2>
          <p className="mt-1 text-sm text-muted-foreground">Kategorileri sürükleyerek sıralayın; sıralama bırakınca otomatik kaydedilir.</p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[44px_96px_minmax(220px,1fr)_180px_120px_120px_260px] gap-3 border-b border-border px-3 pb-2 text-xs font-semibold uppercase text-muted-foreground">
              <span />
              <span>Görsel</span>
              <span>Kategori adı</span>
              <span>Üst kategori</span>
              <span>Ürün</span>
              <span>Durum</span>
              <span className="text-right">İşlemler</span>
            </div>
            <div className="divide-y divide-border">
              {orderedCategories.map((category) => (
                <div
                  key={category.id}
                  draggable
                  onDragStart={() => setDraggedId(category.id)}
                  onDragOver={(event) => {
                    event.preventDefault();
                    moveCategory(category.id);
                  }}
                  onDragEnd={() => {
                    saveCategoryOrder();
                    setDraggedId(null);
                  }}
                  className="grid grid-cols-[44px_96px_minmax(220px,1fr)_180px_120px_120px_260px] items-center gap-3 px-3 py-3"
                >
                  <div className="flex cursor-grab justify-center text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <div className="relative h-16 w-24 overflow-hidden rounded-md bg-muted">
                    <Image src={category.imageUrl ?? "/placeholders/category.svg"} alt={categoryName(category)} fill className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{categoryName(category)}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">/{category.slug}</p>
                  </div>
                  <span className="truncate text-sm text-muted-foreground">{category.parentName ?? "Üst kategori yok"}</span>
                  <span className="text-sm text-muted-foreground">{category.productCount} ürün</span>
                  <span className={category.isActive ? "text-sm font-medium text-emerald-700" : "text-sm font-medium text-muted-foreground"}>
                    {category.isActive ? "Aktif" : "Pasif"}
                  </span>
                  <div className="flex justify-end gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => setViewCategory(category)}>
                      <Eye className="h-4 w-4" />
                      Görüntüle
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditCategory(category)}>
                      <Pencil className="h-4 w-4" />
                      Düzenle
                    </Button>
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={category.id} />
                      <ConfirmSubmitButton
                        size="sm"
                        variant="outline"
                        message="Bu kategori silinecek. Devam etmek istiyor musunuz?"
                      >
                        <Trash2 className="h-4 w-4" />
                        Sil
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {pending ? <p className="mt-3 text-xs text-muted-foreground">Sıralama kaydediliyor...</p> : null}
      </Card>

      {viewCategory ? <CategoryViewModal category={viewCategory} onClose={() => setViewCategory(null)} /> : null}

      {editCategory ? (
        <div className="fixed inset-0 z-50 bg-primary/60 p-4 backdrop-blur-sm">
          <div className="mx-auto max-h-[92vh] max-w-6xl overflow-y-auto rounded-lg bg-card p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Kategori düzenle</h2>
                <p className="mt-1 text-sm text-muted-foreground">{categoryName(editCategory)}</p>
              </div>
              <Button type="button" size="icon" variant="outline" onClick={() => setEditCategory(null)} aria-label="Kapat">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CategoryForm
              action={updateCategoryAction}
              category={editCategory}
              categories={categoryOptions}
              media={media}
              mediaCategories={mediaCategories}
              onClose={() => setEditCategory(null)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function CategoryViewModal({ category, onClose }: { category: CategoryTableRow; onClose: () => void }) {
  const tr = category.translations.find((item) => item.locale === "tr");
  const en = category.translations.find((item) => item.locale === "en");
  const es = category.translations.find((item) => item.locale === "es");

  return (
    <div className="fixed inset-0 z-50 bg-primary/60 p-4 backdrop-blur-sm">
      <Card className="mx-auto max-h-[92vh] max-w-4xl overflow-y-auto p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{categoryName(category)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">/{category.slug}</p>
          </div>
          <Button type="button" size="icon" variant="outline" onClick={onClose} aria-label="Kapat">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
            <Image src={category.imageUrl ?? "/placeholders/category.svg"} alt={categoryName(category)} fill className="object-cover" />
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Info label="Durum" value={category.isActive ? "Aktif" : "Pasif"} />
            <Info label="Üst kategori" value={category.parentName ?? "Üst kategori yok"} />
            <Info label="Ürün sayısı" value={`${category.productCount} ürün`} />
            <Info label="Alt kategori sayısı" value={`${category.childCount} kategori`} />
            <Info label="Sıra" value={String(category.sortOrder)} />
            <Info label="Slug" value={category.slug} />
          </div>
        </div>

        <div className="mt-4 space-y-3 text-sm">
          <Info label="Türkçe açıklama" value={tr?.description || "-"} block />
          <Info label="İngilizce ad / açıklama" value={`${en?.name || "-"}${en?.description ? ` - ${en.description}` : ""}`} block />
          <Info label="İspanyolca ad / açıklama" value={`${es?.name || "-"}${es?.description ? ` - ${es.description}` : ""}`} block />
        </div>
      </Card>
    </div>
  );
}

function Info({ label, value, block = false }: { label: string; value: string; block?: boolean }) {
  return (
    <div className={block ? "" : "rounded-md border border-border p-3"}>
      <p className="font-medium">{label}</p>
      <p className="mt-1 text-muted-foreground">{value}</p>
    </div>
  );
}

function categoryName(category: CategoryTableRow | CategoryFormCategory) {
  return category.translations.find((item) => item.locale === "tr")?.name ?? category.slug;
}
