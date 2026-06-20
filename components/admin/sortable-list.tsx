"use client";

import { GripVertical, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { updateSortOrderAction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";

type SortableListProps = {
  type: "menu" | "category" | "product";
  items: { id: string; label: string }[];
};

export function SortableList({ type, items }: SortableListProps) {
  const [ordered, setOrdered] = useState(items);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
    <div className="space-y-2">
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
          className="flex cursor-grab items-center gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <span>{item.label}</span>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={save} disabled={pending}>
        <Save className="h-4 w-4" />
        Sıralamayı kaydet
      </Button>
    </div>
  );
}
