"use server";

import { cookies } from "next/headers";

export type AdminFlashType = "success" | "error" | "info";

export async function setAdminFlash(type: AdminFlashType, message: string) {
  const cookieStore = await cookies();
  cookieStore.set(
    "admin_flash",
    encodeURIComponent(JSON.stringify({ type, message, createdAt: Date.now() })),
    {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 30
    }
  );
}
