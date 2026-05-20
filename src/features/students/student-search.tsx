"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useTransition } from "react";

export function StudentSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const currentSearch = searchParams.get("search") ?? "";

  function handleSearch(term: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    startTransition(() => {
      router.replace(`/dashboard/students?${params.toString()}`);
    });
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input
        type="text"
        placeholder="Search by name, email, phone, or student number..."
        defaultValue={currentSearch}
        onChange={(e) => handleSearch(e.target.value)}
        className={`w-full rounded-md border border-zinc-300 bg-white py-2 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 ${isPending ? "opacity-70" : ""}`}
      />
    </div>
  );
}
