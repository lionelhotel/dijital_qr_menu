import type { UserRole } from "@prisma/client";

export type Permission =
  | "dashboard:read"
  | "category:write"
  | "product:write"
  | "media:write"
  | "settings:write"
  | "users:write"
  | "audit:read";

const rolePermissions: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "dashboard:read",
    "category:write",
    "product:write",
    "media:write",
    "settings:write",
    "users:write",
    "audit:read"
  ],
  MENU_MANAGER: ["dashboard:read", "category:write", "product:write", "media:write"],
  EDITOR: ["dashboard:read", "product:write", "media:write"]
};

export function can(role: UserRole, permission: Permission) {
  return rolePermissions[role].includes(permission);
}
