"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { Eye, GripVertical, Pencil, Trash2, X } from "lucide-react";
import { deleteMenuAction, updateMenuAction, updateSortOrderAction } from "@/lib/admin/actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { MenuForm, type MenuFormMenu } from "@/components/admin/menu-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type MediaItem = { id: string; url: string; originalName: string; category: { name: string } | null };
type MediaCategory = { id: string; name: string };

export type MenuTableRow = MenuFormMenu & {
  productCount: number;
};

export function MenuTable({
  menus,
  media,
  mediaCategories
}: {
  menus: MenuTableRow[];
  media: MediaItem[];
  mediaCategories: MediaCategory[];
}) {
  const [orderedMenus, setOrderedMenus] = useState(menus);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [viewMenu, setViewMenu] = useState<MenuTableRow | null>(null);
  const [editMenu, setEditMenu] = useState<MenuTableRow | null>(null);
  const [savedOrder, setSavedOrder] = useState(() => menus.map((menu) => menu.id).join(","));
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setOrderedMenus(menus);
    setSavedOrder(menus.map((menu) => menu.id).join(","));
  }, [menus]);

  function moveMenu(targetId: string) {
    if (!draggedId || draggedId === targetId) return;
    setOrderedMenus((current) => {
      const next = [...current];
      const from = next.findIndex((menu) => menu.id === draggedId);
      const to = next.findIndex((menu) => menu.id === targetId);
      if (from < 0 || to < 0) return current;
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function saveMenuOrder() {
    const ids = orderedMenus.map((menu) => menu.id).join(",");
    if (!ids || ids === savedOrder) return;

    const formData = new FormData();
    formData.set("type", "menu");
    formData.set("ids", ids);
    setSavedOrder(ids);
    startTransition(() => {
      void updateSortOrderAction(formData);
    });
  }

  return (
    <>
      <Card className="p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Menü listesi</h2>
            <p className="mt-1 text-sm text-muted-foreground">Menüleri sürükleyerek sıralayın; sıralama bırakınca otomatik kaydedilir.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[920px]">
            <div className="grid grid-cols-[44px_96px_minmax(220px,1fr)_160px_120px_260px] gap-3 border-b border-border px-3 pb-2 text-xs font-semibold uppercase text-muted-foreground">
              <span />
              <span>Görsel</span>
              <span>Menü adı</span>
              <span>Ürün sayısı</span>
              <span>Durum</span>
              <span className="text-right">İşlemler</span>
            </div>
            <div className="divide-y divide-border">
              {orderedMenus.map((menu) => (
                <div
                  key={menu.id}
                  draggable
                  onDragStart={() => setDraggedId(menu.id)}
                  onDragOver={(event) => {
                    event.preventDefault();
                    moveMenu(menu.id);
                  }}
                  onDragEnd={() => {
                    saveMenuOrder();
                    setDraggedId(null);
                  }}
                  className="grid grid-cols-[44px_96px_minmax(220px,1fr)_160px_120px_260px] items-center gap-3 px-3 py-3"
                >
                  <div className="flex cursor-grab justify-center text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <div className="relative h-16 w-24 overflow-hidden rounded-md bg-muted">
                    <Image src={menu.imageUrl ?? "/placeholders/category.svg"} alt={menuName(menu)} fill className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{menuName(menu)}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">/{menu.slug}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{menu.productCount} ürün</span>
                  <span className={menu.isActive ? "text-sm font-medium text-emerald-700" : "text-sm font-medium text-muted-foreground"}>
                    {menu.isActive ? "Aktif" : "Pasif"}
                  </span>
                  <div className="flex justify-end gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => setViewMenu(menu)}>
                      <Eye className="h-4 w-4" />
                      Görüntüle
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditMenu(menu)}>
                      <Pencil className="h-4 w-4" />
                      Düzenle
                    </Button>
                    <form action={deleteMenuAction}>
                      <input type="hidden" name="id" value={menu.id} />
                      <ConfirmSubmitButton
                        size="sm"
                        variant="outline"
                        message="Bu menü silinecek. Devam etmek istiyor musunuz?"
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

      {viewMenu ? <MenuViewModal menu={viewMenu} onClose={() => setViewMenu(null)} /> : null}

      {editMenu ? (
        <div className="fixed inset-0 z-50 bg-primary/60 p-4 backdrop-blur-sm">
          <div className="mx-auto max-h-[92vh] max-w-6xl overflow-y-auto rounded-lg bg-card p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Menü düzenle</h2>
                <p className="mt-1 text-sm text-muted-foreground">{menuName(editMenu)}</p>
              </div>
              <Button type="button" size="icon" variant="outline" onClick={() => setEditMenu(null)} aria-label="Kapat">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <MenuForm action={updateMenuAction} menu={editMenu} media={media} mediaCategories={mediaCategories} />
          </div>
        </div>
      ) : null}
    </>
  );
}

function MenuViewModal({ menu, onClose }: { menu: MenuTableRow; onClose: () => void }) {
  const tr = menu.translations.find((item) => item.locale === "tr");
  const en = menu.translations.find((item) => item.locale === "en");
  const es = menu.translations.find((item) => item.locale === "es");

  return (
    <div className="fixed inset-0 z-50 bg-primary/60 p-4 backdrop-blur-sm">
      <Card className="mx-auto max-h-[92vh] max-w-4xl overflow-y-auto p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{menuName(menu)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">/{menu.slug}</p>
          </div>
          <Button type="button" size="icon" variant="outline" onClick={onClose} aria-label="Kapat">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
            <Image src={menu.imageUrl ?? "/placeholders/category.svg"} alt={menuName(menu)} fill className="object-cover" />
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Info label="Durum" value={menu.isActive ? "Aktif" : "Pasif"} />
            <Info label="Ürün sayısı" value={`${menu.productCount} ürün`} />
            <Info label="Sıra" value={String(menu.sortOrder)} />
            <Info label="Slug" value={menu.slug} />
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

function menuName(menu: MenuTableRow | MenuFormMenu) {
  return menu.translations.find((item) => item.locale === "tr")?.name ?? menu.slug;
}
