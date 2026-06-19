"use server";

import { compare } from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuditAction } from "@prisma/client";
import { audit } from "@/lib/audit/audit";
import { prisma } from "@/lib/database/prisma";
import { loginSchema } from "@/lib/validation/menu";
import { clearSession, setSession } from "./session";
import { hitRateLimit } from "./rate-limit";

export type LoginState = { error?: string };

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password")
  });

  if (!parsed.success) return { error: "Giriş bilgileri eksik veya hatalı." };

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (hitRateLimit(`login:${ip}`)) {
    return { error: "Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin." };
  }

  const { identifier, password } = parsed.data;
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier.toLowerCase() }, { username: identifier }],
      deletedAt: null
    }
  });

  const valid = user ? await compare(password, user.passwordHash) : false;
  if (!user || !valid || !user.isActive) {
    await audit({
      action: AuditAction.LOGIN_FAILED,
      resourceType: "User",
      newValue: { identifier },
      ipAddress: ip,
      userAgent: requestHeaders.get("user-agent")
    });
    return { error: "Kullanıcı adı veya parola hatalı." };
  }

  await setSession(user.id);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await audit({
    userId: user.id,
    action: AuditAction.LOGIN_SUCCESS,
    resourceType: "User",
    resourceId: user.id,
    ipAddress: ip,
    userAgent: requestHeaders.get("user-agent")
  });

  redirect("/admin/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/admin/login");
}
