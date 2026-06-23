"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

export function NutritionEnergyField({ defaultCalories }: { defaultCalories?: number | null }) {
  const [calories, setCalories] = useState(defaultCalories?.toString() ?? "");
  const energy = useMemo(() => {
    const value = Number(calories);
    if (!Number.isFinite(value) || value <= 0) return null;
    return Math.round(value * 4.184);
  }, [calories]);

  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_160px]">
      <Input
        name="calories"
        type="number"
        min={0}
        value={calories}
        onChange={(event) => setCalories(event.target.value)}
      />
      <div className="flex h-10 items-center rounded-md border border-border bg-muted px-3 text-sm text-muted-foreground">
        {energy ? `${energy} kJ enerji` : "Enerji hesaplanmadı"}
      </div>
    </div>
  );
}
