"use client";

import { GripVertical, Save } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { updateSortOrderAction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SortableListProps = {
  type: "menu" | "category" | "product";
  items: { id: string; label: string }[];
  layout?: "vertical" | "horizontal";
};

export function SortableList({ type, items, layout = "vertical" }: SortableListProps) {
  const [ordered, setOrdered] = useState(items);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isHorizontal = layout === "horizontal";

  useEffect(() => {
    setOrdered(items);
  }, [items]);

  function move(targetId: string) {
    if (!draggedId || draggedId === targetId) return;
    const next = [...ordered];
    const from = next.findIndex((item) => item.id === draggedId);
    const to = next.findIndex((item) => item.id === targetId);
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setOrdered(next);
  }

  function save() {
    const formData = new FormData();
    formData.set("type", type);
    formData.set("ids", ordered.map((item) => item.id).join(","));
    startTransition(() => {
      void updateSortOrderAction(formData);
    });
  }

  return (
    <div className="space-y-3">
      <div className={cn(isHorizontal ? "flex gap-2 overflow-x-auto pb-2" : "space-y-2")}>
        {ordered.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => setDraggedId(item.id)}
            onDragOver={(event) => {
              event.preventDefault();
              move(item.id);
            }}
            onDragEnd={() => setDraggedId(null)}
            className={cn(
              "flex cursor-grab items-center gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm",
              isHorizontal && "min-w-52 max-w-64 shrink-0"
            )}
          >
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{item.label}</span>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" onClick={save} disabled={pending}>
        <Save className="h-4 w-4" />
        Sıralamayı kaydet
      </Button>
    </div>
  );
}
