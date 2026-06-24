"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

type CaloriesEvent = CustomEvent<{ productId: string; calories: string }>;

export function NutritionEnergyField({
  defaultCalories,
  productId,
  compact = false
}: {
  defaultCalories?: number | null;
  productId?: string;
  compact?: boolean;
}) {
  const [calories, setCalories] = useState(defaultCalories?.toString() ?? "");
  const energy = useMemo(() => {
    const value = Number(calories);
    if (!Number.isFinite(value) || value <= 0) return null;
    return Math.round(value * 4.184);
  }, [calories]);

  useEffect(() => {
    if (!productId) return;

    function handleCalories(event: Event) {
      const customEvent = event as CaloriesEvent;
      if (customEvent.detail?.productId === productId) setCalories(customEvent.detail.calories);
    }

    window.addEventListener("admin-product-calories", handleCalories);
    return () => window.removeEventListener("admin-product-calories", handleCalories);
  }, [productId]);

  return (
    <div className={compact ? "grid gap-2 sm:grid-cols-[7rem_8rem]" : "grid gap-2 sm:grid-cols-[1fr_160px]"}>
      <Input
        name="calories"
        type="number"
        min={0}
        value={calories}
        onChange={(event) => setCalories(event.target.value)}
        className={compact ? "max-w-28" : undefined}
      />
      <div className="flex h-10 items-center truncate rounded-md border border-border bg-muted px-3 text-sm text-muted-foreground">
        {energy ? `${energy} kJ enerji` : "Enerji yok"}
      </div>
    </div>
  );
}
