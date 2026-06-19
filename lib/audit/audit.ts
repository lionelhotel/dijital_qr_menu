import { Prisma, type AuditAction } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";

type AuditInput = {
  userId?: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function audit(input: AuditInput) {
  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      oldValue: sanitize(input.oldValue),
      newValue: sanitize(input.newValue),
      ipAddress: input.ipAddress ?? undefined,
      userAgent: input.userAgent ?? undefined
    }
  });
}

function sanitize(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object") return value as never;
  const clone = JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  for (const key of Object.keys(clone)) {
    if (/password|token|secret/i.test(key)) clone[key] = "[redacted]";
  }
  return clone as Prisma.InputJsonObject;
}
