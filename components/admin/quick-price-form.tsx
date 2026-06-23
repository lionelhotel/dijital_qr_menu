"use client";

import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PriceResult =
  | { ok: true; price: string }
  | { ok: false; reason: string }
  | void;

export function QuickPriceForm({
  productId,
  price,
  action
}: {
  productId: string;
  price: string;
  action: (formData: FormData) => Promise<PriceResult>;
}) {
  const router = useRouter();
  const [priceValue, setPriceValue] = useState(price);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const result = await action(formData);
          if (result?.ok) {
            setPriceValue(result.price);
            window.dispatchEvent(
              new CustomEvent("admin-product-price", {
                detail: { productId, price: result.price }
              })
            );
          }
          router.refresh();
        });
      }}
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
        value={priceValue}
        onChange={(event) => setPriceValue(event.target.value)}
        aria-label="Ürün fiyatı"
        className="h-9 w-24 text-right font-semibold text-accent"
      />
      <Button
        type="submit"
        size="icon"
        variant="accent"
        disabled={pending}
        className="h-9 w-9 rounded-full"
        aria-label="Fiyatı kaydet"
        title="Fiyatı kaydet"
      >
        <Save className="h-4 w-4" />
      </Button>
    </form>
  );
}
