"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { LabeledField } from "@/components/forms/labeled-field";

type KeyIconFieldsProps = {
  sourceName: string;
  defaultKey?: string;
  defaultIcon?: string;
  type: "allergen" | "diet";
};

const allergenOptions = [
  { value: "🌾", label: "Gluten", keywords: ["gluten", "bugday", "buğday", "un", "ekmek"] },
  { value: "🥛", label: "Süt", keywords: ["sut", "süt", "peynir", "krema", "yogurt", "yoğurt"] },
  { value: "🥚", label: "Yumurta", keywords: ["yumurta"] },
  { value: "🥜", label: "Yer fıstığı", keywords: ["fistik", "fıstık", "peanut"] },
  { value: "🌰", label: "Kuruyemiş", keywords: ["findik", "fındık", "badem", "ceviz", "antep"] },
  { value: "🐟", label: "Balık", keywords: ["balik", "balık", "somon"] },
  { value: "🦐", label: "Kabuklu deniz ürünü", keywords: ["karides", "midye", "istiridye"] },
  { value: "🌱", label: "Soya", keywords: ["soya"] },
  { value: "⚪", label: "Susam", keywords: ["susam"] },
  { value: "!", label: "Genel alerjen", keywords: [] }
];

const dietOptions = [
  { value: "🌿", label: "Vegan", keywords: ["vegan"] },
  { value: "🥗", label: "Vejetaryen", keywords: ["vejetaryen", "vegetarian"] },
  { value: "🌾", label: "Glutensiz", keywords: ["glutensiz", "gluten free"] },
  { value: "⭐", label: "Şef önerisi", keywords: ["sef", "şef", "chef", "oner", "öner"] },
  { value: "🛡️", label: "Mevcut", keywords: ["mevcut", "available"] },
  { value: "🔥", label: "Acılı", keywords: ["acili", "acılı", "spicy"] },
  { value: "✨", label: "Genel etiket", keywords: [] }
];

export function KeyIconFields({ sourceName, defaultKey, defaultIcon, type }: KeyIconFieldsProps) {
  const options = type === "allergen" ? allergenOptions : dietOptions;
  const containerRef = useRef<HTMLDivElement>(null);
  const [keyValue, setKeyValue] = useState(defaultKey ?? "");
  const [icon, setIcon] = useState(defaultIcon || options[0]?.value || "•");
  const [keyTouched, setKeyTouched] = useState(false);
  const [iconTouched, setIconTouched] = useState(false);

  const fallbackIcon = useMemo(() => options[0]?.value || "•", [options]);

  useEffect(() => {
    const form = containerRef.current?.closest("form");
    const source = form?.querySelector<HTMLInputElement>(`[name='${sourceName}']`);
    if (!source) return;

    function updateFromSource() {
      const value = source?.value ?? "";
      const nextKey = slugifyLocal(value);
      const normalized = normalize(value);
      const match = options.find((option) => option.keywords.some((keyword) => normalized.includes(normalize(keyword))));

      if (!keyTouched) setKeyValue(nextKey);
      if (!iconTouched) setIcon(match?.value ?? fallbackIcon);
    }

    updateFromSource();
    source.addEventListener("input", updateFromSource);
    return () => source.removeEventListener("input", updateFromSource);
  }, [fallbackIcon, iconTouched, keyTouched, options, sourceName]);

  return (
    <div ref={containerRef} className="grid gap-3 sm:grid-cols-2">
      <LabeledField label="Sistem anahtarı">
        <Input
          name="key"
          value={keyValue}
          onChange={(event) => {
            setKeyTouched(true);
            setKeyValue(event.target.value);
          }}
        />
      </LabeledField>
      <LabeledField label="İkon">
        <select
          name="icon"
          value={icon}
          onChange={(event) => {
            setIconTouched(true);
            setIcon(event.target.value);
          }}
          className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
        >
          {options.map((option) => (
            <option key={`${option.value}-${option.label}`} value={option.value}>
              {option.value} {option.label}
            </option>
          ))}
        </select>
      </LabeledField>
    </div>
  );
}

function slugifyLocal(value: string) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}
