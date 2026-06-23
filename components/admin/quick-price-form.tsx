"use client";

import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function QuickPriceForm({
  productId,
  price,
  action
}: {
  productId: string;
  price: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form
      action={action}
      className="flex shrink-0 items-center gap-2"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <input type="hidden" name="id" value={productId} />
      <Input
        name="price"
        type="number"
        step="0.01"
        min="0"
        defaultValue={price}
        aria-label="Ürün fiyatı"
        className="h-9 w-24 text-right font-semibold text-accent"
      />
      <Button
        type="submit"
        size="icon"
        variant="accent"
        className="h-9 w-9 rounded-full"
        aria-label="Fiyatı kaydet"
        title="Fiyatı kaydet"
      >
        <Save className="h-4 w-4" />
      </Button>
    </form>
  );
}
