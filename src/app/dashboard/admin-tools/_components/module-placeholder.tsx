import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";

interface ModulePlaceholderProps {
  title: string;
  description: string;
}

export async function ModulePlaceholder({
  title,
  description,
}: ModulePlaceholderProps) {
  const profile = await getUserProfile();
  const isAdmin = isAdminOrSuper(profile?.role ?? null);

  if (!isAdmin) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-600">
            Admin Tools are available to admin and super admin users only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1>
        <p className="mt-1 text-sm text-zinc-500">Admin Tools</p>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <p className="text-sm text-zinc-600">{description}</p>
      </div>
    </div>
  );
}
