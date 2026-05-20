"use client";

import { useTransition } from "react";
import { createChecklist } from "@/features/checklists/actions";
import { useRouter } from "next/navigation";

interface Props {
  applicationId: string;
}

export function CreateChecklistButton({ applicationId }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleCreate() {
    startTransition(async () => {
      const result = await createChecklist(applicationId);
      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <button
      onClick={handleCreate}
      disabled={isPending}
      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
    >
      {isPending ? "Creating..." : "Create Checklist"}
    </button>
  );
}
