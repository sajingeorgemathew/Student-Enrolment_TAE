import { createClient } from "@/lib/supabase/server";

export type AppRole = "admin" | "sales" | "viewer";

export async function getUserRole(): Promise<AppRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return (profile?.role as AppRole) ?? null;
}
