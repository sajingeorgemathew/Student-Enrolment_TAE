import { getUserProfile } from "@/lib/profile";

export type AppRole = "admin" | "sales" | "viewer";

export async function getUserRole(): Promise<AppRole | null> {
  const profile = await getUserProfile();
  return profile?.role ?? null;
}
