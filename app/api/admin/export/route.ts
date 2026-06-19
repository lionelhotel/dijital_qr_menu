import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";

export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "json";

  const [categories, products, allergens, dietaryTags] = await Promise.all([
    prisma.category.findMany({ include: { translations: true } }),
    prisma.product.findMany({ include: { translations: true, allergens: true, dietaryTags: true } }),
    prisma.allergen.findMany({ include: { translations: true } }),
    prisma.dietaryTag.findMany({ include: { translations: true } })
  ]);

  if (format === "csv") {
    const rows = [
      ["type", "id", "name_tr", "name_en", "name_es"],
      ...products.map((product) => [
        "product",
        product.id,
        product.translations.find((item) => item.locale === "tr")?.name ?? "",
        product.translations.find((item) => item.locale === "en")?.name ?? "",
        product.translations.find((item) => item.locale === "es")?.name ?? ""
      ])
    ];
    return new NextResponse(rows.map((row) => row.map(csvCell).join(",")).join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=menu-export.csv"
      }
    });
  }

  return NextResponse.json({ categories, products, allergens, dietaryTags });
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
