"use client";

import { useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { deleteMediaCategoryAction, updateMediaCategoryAction } from "@/lib/admin/actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { LabeledField } from "@/components/forms/labeled-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type MediaCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
};

export function MediaCategoryManager({ categories }: { categories: MediaCategory[] }) {
  const [editCategory, setEditCategory] = useState<MediaCategory | null>(null);

  return (
    <>
      <details className="mt-4 rounded-lg border border-border p-3">
        <summary className="cursor-pointer text-sm font-semibold">Medya kategorilerini düzenle</summary>
        <div className="mt-3 overflow-x-auto">
          <div className="min-w-[620px]">
            <div className="grid grid-cols-[minmax(220px,1fr)_120px_190px] gap-3 border-b border-border px-3 pb-2 text-xs font-semibold uppercase text-muted-foreground">
              <span>Medya kategori adı</span>
              <span>Sıra</span>
              <span className="text-right">İşlemler</span>
            </div>
            <div className="divide-y divide-border">
              {categories.map((category) => (
                <div key={category.id} className="grid grid-cols-[minmax(220px,1fr)_120px_190px] items-center gap-3 px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{category.name}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">/{category.slug}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{category.sortOrder}</span>
                  <div className="flex justify-end gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditCategory(category)}>
                      <Pencil className="h-4 w-4" />
                      Düzenle
                    </Button>
                    <form action={deleteMediaCategoryAction}>
                      <input type="hidden" name="id" value={category.id} />
                      <ConfirmSubmitButton
                        size="sm"
                        variant="outline"
                        message="Bu medya kategorisi silinecek. Bu kategoriye bağlı görseller arşivden kaldırılabilir. Devam etmek istiyor musunuz?"
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
      </details>

      {editCategory ? (
        <div className="fixed inset-0 z-50 bg-primary/60 p-4 backdrop-blur-sm">
          <Card className="mx-auto max-w-3xl p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Medya kategorisi düzenle</h2>
                <p className="mt-1 text-sm text-muted-foreground">{editCategory.name}</p>
              </div>
              <Button type="button" size="icon" variant="outline" onClick={() => setEditCategory(null)} aria-label="Kapat">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <MediaCategoryEditForm category={editCategory} />
          </Card>
        </div>
      ) : null}
    </>
  );
}

function MediaCategoryEditForm({ category }: { category: MediaCategory }) {
  return (
    <form action={updateMediaCategoryAction} className="mt-4 grid gap-3 md:grid-cols-2">
      <input type="hidden" name="id" value={category.id} />
      <LabeledField label="Kategori adı">
        <Input name="name" defaultValue={category.name} required />
      </LabeledField>
      <LabeledField label="Slug">
        <Input name="slug" defaultValue={category.slug} />
      </LabeledField>
      <LabeledField label="Açıklama" className="md:col-span-2">
        <Input name="description" defaultValue={category.description ?? ""} />
      </LabeledField>
      <LabeledField label="Sıra">
        <Input name="sortOrder" type="number" defaultValue={category.sortOrder} />
      </LabeledField>
      <div className="flex items-end justify-end">
        <Button type="submit">Kaydet</Button>
      </div>
    </form>
  );
}
