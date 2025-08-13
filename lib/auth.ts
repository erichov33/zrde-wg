export interface User {
  id: string
  email: string
  role: UserRole
  organization: string
  permissions: Permission[]
  lastLogin?: Date
}

export type UserRole = "Super Admin" | "Organization Admin" | "Risk Manager" | "Analyst" | "API User" | "Basic User"

export type Permission =
  | "system:admin"
  | "org:manage"
  | "workflows:create"
  | "workflows:edit"
  | "analytics:view"
  | "api:manage"
  | "reports:generate"

export const rolePermissions: Record<UserRole, Permission[]> = {
  "Super Admin": [
    "system:admin",
    "org:manage",
    "workflows:create",
    "workflows:edit",
    "analytics:view",
    "api:manage",
    "reports:generate",
  ],
  "Organization Admin": ["org:manage", "workflows:create", "workflows:edit", "analytics:view", "reports:generate"],
  "Risk Manager": ["workflows:create", "workflows:edit", "analytics:view", "reports:generate"],
  Analyst: ["analytics:view", "reports:generate"],
  "API User": ["api:manage"],
  "Basic User": ["analytics:view"],
}

export function hasPermission(user: User, permission: Permission): boolean {
  return user.permissions.includes(permission)
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const userData = localStorage.getItem("user")
  if (!userData) return null

  try {
    const user = JSON.parse(userData)
    return {
      ...user,
      id: user.id || "1",
      permissions: rolePermissions[user.role as UserRole] || [],
    }
  } catch {
    return null
  }
}

export function signOut(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user")
    window.location.href = "/"
  }
}
