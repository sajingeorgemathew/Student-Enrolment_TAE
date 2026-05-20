import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/roles";

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: AppRole;
  is_active: boolean;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    role: profile.role as AppRole,
    is_active: profile.is_active,
  };
}
