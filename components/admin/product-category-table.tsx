"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { Eye, GripVertical, Pencil, Trash2, X } from "lucide-react";
import {
  calculateProductNutritionAction,
  deleteProductAction,
  updateProductAction,
  updateProductPriceAction,
  updateSortOrderAction
} from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CalculateNutritionForm } from "@/components/admin/calculate-nutrition-form";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { ProductForm, type ProductFormProduct } from "@/components/admin/product-form";
import { QuickPriceForm } from "@/components/admin/quick-price-form";

type Translation = { locale: string; name: string; shortDescription?: string | null; ingredients?: string | null };
type LookupItem = { id: string; translations: { locale: string; name: string }[] };
type AllergenItem = { id: string; key: string; translations: { locale: string; name: string }[] };
type DietaryTagItem = { id: string; key: string; icon: string; translations: { locale: string; name: string }[] };
type MediaItem = { id: string; url: string; originalName: string; category: { name: string } | null };
type MediaCategory = { id: string; name: string };

export type ProductTableRow = ProductFormProduct & {
  categoryName: string;
  translations: Translation[];
};

export type ProductCategoryGroup = {
  id: string;
  name: string;
  products: ProductTableRow[];
};

export function ProductCategoryTable({
  groups,
  categories,
  menus,
  allergens,
  dietaryTags,
  media,
  mediaCategories
}: {
  groups: ProductCategoryGroup[];
  categories: LookupItem[];
  menus: LookupItem[];
  allergens: AllergenItem[];
  dietaryTags: DietaryTagItem[];
  media: MediaItem[];
  mediaCategories: MediaCategory[];
}) {
  const [orderedGroups, setOrderedGroups] = useState(groups);
  const [dragged, setDragged] = useState<{ categoryId: string; productId: string } | null>(null);
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null);
  const [viewProduct, setViewProduct] = useState<ProductTableRow | null>(null);
  const [editProduct, setEditProduct] = useState<ProductTableRow | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setOrderedGroups(groups);
  }, [groups]);

  function moveProduct(categoryId: string, targetProductId: string) {
    if (!dragged || dragged.categoryId !== categoryId || dragged.productId === targetProductId) return;
    setOrderedGroups((current) =>
      current.map((group) => {
        if (group.id !== categoryId) return group;
        const next = [...group.products];
        const from = next.findIndex((product) => product.id === dragged.productId);
        const to = next.findIndex((product) => product.id === targetProductId);
        if (from < 0 || to < 0) return group;
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        return { ...group, products: next };
      })
    );
  }

  function saveCategoryOrder(categoryId: string) {
    const group = orderedGroups.find((item) => item.id === categoryId);
    if (!group) return;
    const formData = new FormData();
    formData.set("type", "product");
    formData.set("ids", group.products.map((product) => product.id).join(","));
    startTransition(() => {
      void updateSortOrderAction(formData);
    });
  }

  function moveCategory(targetCategoryId: string) {
    if (!draggedCategoryId || draggedCategoryId === targetCategoryId) return;
    setOrderedGroups((current) => {
      const next = [...current];
      const from = next.findIndex((group) => group.id === draggedCategoryId);
      const to = next.findIndex((group) => group.id === targetCategoryId);
      if (from < 0 || to < 0) return current;
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function saveCategoryGroupOrder() {
    const formData = new FormData();
    formData.set("type", "category");
    formData.set("ids", orderedGroups.map((group) => group.id).join(","));
    startTransition(() => {
      void updateSortOrderAction(formData);
    });
  }

  return (
    <>
      <div className="space-y-3">
        {orderedGroups.map((group) => (
          <details
            key={group.id}
            draggable
            onDragStart={() => setDraggedCategoryId(group.id)}
            onDragOver={(event) => {
              event.preventDefault();
              moveCategory(group.id);
            }}
            onDragEnd={() => {
              saveCategoryGroupOrder();
              setDraggedCategoryId(null);
            }}
            className="rounded-lg border border-border bg-card shadow-soft"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-semibold marker:hidden">
              <span className="flex min-w-0 items-center gap-3">
                <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
                <span className="truncate">{group.name}</span>
              </span>
              <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                {group.products.length} ürün
              </span>
            </summary>
            <div className="border-t border-border p-3">
              {group.products.length ? (
                <div className="overflow-x-auto">
                  <div className="min-w-[860px]">
                    <div className="grid grid-cols-[44px_72px_minmax(220px,1fr)_190px_260px] gap-3 border-b border-border px-3 pb-2 text-xs font-semibold uppercase text-muted-foreground">
                      <span />
                      <span>Görsel</span>
                      <span>Ürün adı</span>
                      <span>Fiyat</span>
                      <span className="text-right">İşlemler</span>
                    </div>
                    <div className="divide-y divide-border">
                      {group.products.map((product) => (
                        <div
                          key={product.id}
                          draggable
                          onDragStart={() => setDragged({ categoryId: group.id, productId: product.id })}
                          onDragOver={(event) => {
                            event.preventDefault();
                            moveProduct(group.id, product.id);
                          }}
                          onDragEnd={() => {
                            saveCategoryOrder(group.id);
                            setDragged(null);
                          }}
                          className="grid grid-cols-[44px_72px_minmax(220px,1fr)_190px_260px] items-center gap-3 px-3 py-3"
                        >
                          <div className="flex cursor-grab justify-center text-muted-foreground">
                            <GripVertical className="h-4 w-4" />
                          </div>
                          <div className="relative h-14 w-14 overflow-hidden rounded-md bg-muted">
                            <Image src={product.mainImageUrl ?? "/placeholders/food.svg"} alt={productName(product)} fill className="object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{productName(product)}</p>
                          </div>
                          <QuickPriceForm productId={product.id} price={product.price} action={updateProductPriceAction} />
                          <div className="flex justify-end gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => setViewProduct(product)}>
                              <Eye className="h-4 w-4" />
                              Görüntüle
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => setEditProduct(product)}>
                              <Pencil className="h-4 w-4" />
                              Düzenle
                            </Button>
                            <form action={deleteProductAction}>
                              <input type="hidden" name="id" value={product.id} />
                              <ConfirmSubmitButton
                                size="sm"
                                variant="outline"
                                message="Bu ürün silinecek. Devam etmek istiyor musunuz?"
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
              ) : (
                <p className="p-3 text-sm text-muted-foreground">Bu kategoride ürün yok.</p>
              )}
              {pending ? <p className="mt-2 text-xs text-muted-foreground">Sıralama kaydediliyor...</p> : null}
            </div>
          </details>
        ))}
      </div>

      {viewProduct ? (
        <ProductViewModal product={viewProduct} menus={menus} allergens={allergens} dietaryTags={dietaryTags} onClose={() => setViewProduct(null)} />
      ) : null}

      {editProduct ? (
        <div className="fixed inset-0 z-50 bg-primary/60 p-4 backdrop-blur-sm">
          <div className="mx-auto max-h-[92vh] max-w-6xl overflow-y-auto rounded-lg bg-card p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Ürün düzenle</h2>
                <p className="mt-1 text-sm text-muted-foreground">{productName(editProduct)}</p>
              </div>
              <Button type="button" size="icon" variant="outline" onClick={() => setEditProduct(null)} aria-label="Kapat">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <CalculateNutritionForm productId={editProduct.id} action={calculateProductNutritionAction} />
            </div>
            <ProductForm
              action={updateProductAction}
              product={editProduct}
              categories={categories}
              menus={menus}
              allergens={allergens}
              dietaryTags={dietaryTags}
              media={media}
              mediaCategories={mediaCategories}
              onClose={() => setEditProduct(null)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function ProductViewModal({
  product,
  menus,
  allergens,
  dietaryTags,
  onClose
}: {
  product: ProductTableRow;
  menus: LookupItem[];
  allergens: AllergenItem[];
  dietaryTags: DietaryTagItem[];
  onClose: () => void;
}) {
  const tr = product.translations.find((item) => item.locale === "tr");
  const selectedMenuNames = product.menus
    .map((relation) => menus.find((menu) => menu.id === relation.menuId)?.translations.find((item) => item.locale === "tr")?.name)
    .filter(Boolean);
  const selectedAllergenNames = product.allergens
    .map((relation) => allergens.find((allergen) => allergen.id === relation.allergenId)?.translations.find((item) => item.locale === "tr")?.name)
    .filter(Boolean);
  const selectedDietaryTagNames = product.dietaryTags
    .map((relation) => dietaryTags.find((tag) => tag.id === relation.dietaryId)?.translations.find((item) => item.locale === "tr")?.name)
    .filter(Boolean);
  const energy = product.calories ? Math.round(product.calories * 4.184) : null;

  return (
    <div className="fixed inset-0 z-50 bg-primary/60 p-4 backdrop-blur-sm">
      <Card className="mx-auto max-h-[92vh] max-w-4xl overflow-y-auto p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{productName(product)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{product.categoryName}</p>
          </div>
          <Button type="button" size="icon" variant="outline" onClick={onClose} aria-label="Kapat">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[260px_1fr]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
            <Image src={product.mainImageUrl ?? "/placeholders/food.svg"} alt={productName(product)} fill className="object-cover" />
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Info label="Fiyat" value={`${product.price} ${product.currency}`} />
            <Info label="Durum" value={product.isAvailable ? "Mevcut" : "Mevcut değil"} />
            <Info label="Kalori / enerji" value={product.calories ? `${product.calories} kcal${energy ? ` / ${energy} kJ` : ""}` : "-"} />
            <Info label="Süre" value={product.prepMinutes ? `${product.prepMinutes} dk` : "-"} />
            <Info label="Acılı" value={product.spicyLevel > 0 ? "Acılı" : "Acısız"} />
            <Info label="Durum etiketleri" value={[product.isActive ? "Aktif" : "Pasif", product.isNew ? "Yeni" : ""].filter(Boolean).join(", ") || "-"} />
          </div>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          <Info label="Kısa açıklama" value={tr?.shortDescription || "-"} block />
          <Info label="İçerik" value={tr?.ingredients || "-"} block />
          <Info label="Menüler" value={selectedMenuNames.join(", ") || "-"} block />
          <Info label="Alerjenler" value={selectedAllergenNames.join(", ") || "-"} block />
          <Info label="Menüde görünen etiketler" value={selectedDietaryTagNames.join(", ") || "-"} block />
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

function productName(product: ProductTableRow) {
  return product.translations.find((item) => item.locale === "tr")?.name ?? product.id;
}
