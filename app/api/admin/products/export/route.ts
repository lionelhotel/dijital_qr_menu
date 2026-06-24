import { NextResponse } from "next/server";
import { exportProductsXlsx } from "@/lib/admin/product-excel";
import { requireAdmin } from "@/lib/auth/session";

export async function GET() {
  await requireAdmin();
  const workbook = await exportProductsXlsx();
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(workbook, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="products-${date}.xlsx"`,
      "Cache-Control": "no-store"
    }
  });
}
