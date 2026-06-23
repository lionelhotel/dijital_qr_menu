"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

type ProductPriceEvent = CustomEvent<{ productId: string; price: string }>;

export function ProductPriceField({
  productId,
  defaultPrice
}: {
  productId?: string;
  defaultPrice?: string;
}) {
  const [price, setPrice] = useState(defaultPrice ?? "");

  useEffect(() => {
    if (!productId) return;

    function handlePrice(event: Event) {
      const customEvent = event as ProductPriceEvent;
      if (customEvent.detail?.productId === productId) setPrice(customEvent.detail.price);
    }

    window.addEventListener("admin-product-price", handlePrice);
    return () => window.removeEventListener("admin-product-price", handlePrice);
  }, [productId]);

  return (
    <Input
      name="price"
      type="number"
      step="0.01"
      value={price}
      onChange={(event) => setPrice(event.target.value)}
      required
    />
  );
}
