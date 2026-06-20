import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/database/prisma";

export const sessionCookieName = "qr_admin_session";

export function getAdminPath() {
  const configured = process.env.ADMIN_PATH?.trim() || "/admin";
  return configured.startsWith("/") ? configured : `/${configured}`;
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

function shouldUseSecureCookie(requestHeaders: Awaited<ReturnType<typeof headers>>) {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;

  const protocol = requestHeaders.get("x-forwarded-proto");
  const origin = requestHeaders.get("origin");
  const referer = requestHeaders.get("referer");

  if (protocol) return protocol === "https";
  return origin?.startsWith("https://") || referer?.startsWith("https://") || false;
}

export async function setSession(userId: string) {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12);
  const requestHeaders = await headers();

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      ipAddress: requestHeaders.get("x-forwarded-for")?.split(",")[0],
      userAgent: requestHeaders.get("user-agent") ?? undefined
    }
  });

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    secure: shouldUseSecureCookie(requestHeaders),
    sameSite: "lax",
    path: "/",
    expires: expiresAt
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.set(sessionCookieName, "", {
    httpOnly: true,
    secure: shouldUseSecureCookie(requestHeaders),
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true }
  });

  if (!session || session.expiresAt < new Date() || !session.user.isActive) return null;

  const expected = Buffer.from(session.tokenHash);
  const actual = Buffer.from(tokenHash);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  return session.user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect(`${getAdminPath()}/login`);
  return user;
}
