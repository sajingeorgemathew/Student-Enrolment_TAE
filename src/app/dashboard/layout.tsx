import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/profile";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getUserProfile();

  return (
    <div className="flex h-screen bg-zinc-50">
      <Sidebar
        userEmail={user.email ?? ""}
        userRole={profile?.role ?? null}
        userFullName={profile?.full_name ?? null}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-8">
          {!profile && <ProfileMissingBanner />}
          {children}
        </div>
      </main>
    </div>
  );
}

function ProfileMissingBanner() {
  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-sm font-medium text-amber-800">
        Your staff profile has not been set up yet.
      </p>
      <p className="mt-1 text-sm text-amber-700">
        Please contact an administrator to have your profile and role assigned.
      </p>
    </div>
  );
}
