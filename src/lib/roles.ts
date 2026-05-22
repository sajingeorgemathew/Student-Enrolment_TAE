import { getUserProfile } from "@/lib/profile";

export type AppRole = "super_admin" | "admin" | "sales" | "viewer";

export async function getUserRole(): Promise<AppRole | null> {
  const profile = await getUserProfile();
  return profile?.role ?? null;
}

export function isSuperAdmin(role: AppRole | null): boolean {
  return role === "super_admin";
}

export function isAdminOrSuper(role: AppRole | null): boolean {
  return role === "admin" || role === "super_admin";
}

export function isSalesOrAdmin(role: AppRole | null): boolean {
  return role === "sales" || role === "admin" || role === "super_admin";
}

export function canManageRecords(role: AppRole | null): boolean {
  return role === "admin" || role === "super_admin";
}
