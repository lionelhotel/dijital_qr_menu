"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

type NutritionResult =
  | { ok: true; calories?: number; note?: string }
  | { ok: false; reason?: string }
  | void;

export function CalculateNutritionForm({
  productId,
  action
}: {
  productId: string;
  action: (formData: FormData) => Promise<NutritionResult>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const result = await action(formData);
          if (result?.ok && typeof result.calories === "number") {
            window.dispatchEvent(
              new CustomEvent("admin-product-calories", {
                detail: { productId, calories: result.calories.toString() }
              })
            );
          }
          router.refresh();
        });
      }}
    >
      <input type="hidden" name="id" value={productId} />
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Hesaplanıyor" : "AI ile kalori hesapla"}
      </Button>
    </form>
  );
}
