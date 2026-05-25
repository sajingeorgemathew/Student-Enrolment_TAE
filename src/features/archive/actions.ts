"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper, isSuperAdmin } from "@/lib/roles";
import { revalidatePath } from "next/cache";

export type ArchiveActionResult = {
  success: boolean;
  error?: string;
};

const ARCHIVABLE_TABLES = [
  "students",
  "applications",
  "student_documents",
  "programs",
  "batches",
  "fee_schedules",
  "contracts",
] as const;

type ArchivableTable = (typeof ARCHIVABLE_TABLES)[number];

function isArchivableTable(table: string): table is ArchivableTable {
  return (ARCHIVABLE_TABLES as readonly string[]).includes(table);
}

async function logAuditEvent(
  actorId: string,
  actorRole: string,
  eventType: string,
  tableName: string,
  recordId: string,
  reason: string | null,
  payload: Record<string, unknown> | null
) {
  const supabase = await createClient();
  await supabase.from("audit_events").insert({
    actor_id: actorId,
    actor_role: actorRole,
    event_type: eventType,
    table_name: tableName,
    record_id: recordId,
    reason,
    payload: payload ?? undefined,
  });
}

export async function archiveRecord(
  tableName: string,
  recordId: string,
  reason: string
): Promise<ArchiveActionResult> {
  const profile = await getUserProfile();
  if (!profile) return { success: false, error: "You must be logged in." };
  if (!isAdminOrSuper(profile.role)) {
    return { success: false, error: "You do not have permission to archive records." };
  }
  if (!isArchivableTable(tableName)) {
    return { success: false, error: "This record type cannot be archived." };
  }
  if (!reason.trim()) {
    return { success: false, error: "A reason is required for archiving." };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from(tableName)
    .select("id, archived_at")
    .eq("id", recordId)
    .single();

  if (!existing) return { success: false, error: "Record not found." };
  if (existing.archived_at) {
    return { success: false, error: "This record is already archived." };
  }

  const { error } = await supabase
    .from(tableName)
    .update({
      archived_at: new Date().toISOString(),
      archived_by: profile.id,
      archive_reason: reason.trim(),
    })
    .eq("id", recordId);

  if (error) {
    console.error(`Archive error on ${tableName}:`, error.message);
    return { success: false, error: "Could not archive this record." };
  }

  await logAuditEvent(
    profile.id,
    profile.role,
    "archive",
    tableName,
    recordId,
    reason.trim(),
    null
  );

  revalidateRelatedPaths(tableName);
  return { success: true };
}

export async function restoreRecord(
  tableName: string,
  recordId: string
): Promise<ArchiveActionResult> {
  const profile = await getUserProfile();
  if (!profile) return { success: false, error: "You must be logged in." };
  if (!isAdminOrSuper(profile.role)) {
    return { success: false, error: "You do not have permission to restore records." };
  }
  if (!isArchivableTable(tableName)) {
    return { success: false, error: "This record type cannot be restored." };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from(tableName)
    .select("id, archived_at")
    .eq("id", recordId)
    .single();

  if (!existing) return { success: false, error: "Record not found." };
  if (!existing.archived_at) {
    return { success: false, error: "This record is not archived." };
  }

  const { error } = await supabase
    .from(tableName)
    .update({
      archived_at: null,
      archived_by: null,
      archive_reason: null,
    })
    .eq("id", recordId);

  if (error) {
    console.error(`Restore error on ${tableName}:`, error.message);
    return { success: false, error: "Could not restore this record." };
  }

  await logAuditEvent(
    profile.id,
    profile.role,
    "restore",
    tableName,
    recordId,
    null,
    null
  );

  revalidateRelatedPaths(tableName);
  return { success: true };
}

export async function hardDeleteRecord(
  tableName: string,
  recordId: string,
  reason: string
): Promise<ArchiveActionResult> {
  const profile = await getUserProfile();
  if (!profile) return { success: false, error: "You must be logged in." };
  if (!isSuperAdmin(profile.role)) {
    return { success: false, error: "Only super admin can hard delete records." };
  }
  if (!isArchivableTable(tableName)) {
    return { success: false, error: "This record type cannot be deleted." };
  }
  if (!reason.trim()) {
    return { success: false, error: "A reason is required for hard delete." };
  }

  const supabase = await createClient();

  const safetyCheck = await checkDeleteSafety(supabase, tableName, recordId);
  if (!safetyCheck.safe) {
    return { success: false, error: safetyCheck.reason };
  }

  await logAuditEvent(
    profile.id,
    profile.role,
    "hard_delete",
    tableName,
    recordId,
    reason.trim(),
    safetyCheck.snapshot ?? null
  );

  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq("id", recordId);

  if (error) {
    console.error(`Hard delete error on ${tableName}:`, error.message);
    return { success: false, error: "Could not delete this record." };
  }

  revalidateRelatedPaths(tableName);
  return { success: true };
}

async function checkDeleteSafety(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tableName: string,
  recordId: string
): Promise<{ safe: boolean; reason: string; snapshot?: Record<string, unknown> }> {
  if (tableName === "batches") {
    const { count } = await supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("batch_id", recordId)
      .neq("status", "archived");

    if (count && count > 0) {
      return {
        safe: false,
        reason: `Cannot delete this batch - it has ${count} active application(s). Archive or reassign them first.`,
      };
    }
  }

  if (tableName === "programs") {
    const { count } = await supabase
      .from("batches")
      .select("id", { count: "exact", head: true })
      .eq("program_id", recordId)
      .eq("is_active", true);

    if (count && count > 0) {
      return {
        safe: false,
        reason: `Cannot delete this program - it has ${count} active batch(es). Deactivate or archive them first.`,
      };
    }
  }

  if (tableName === "students") {
    const blockers: string[] = [];

    const { count: appCount } = await supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("student_id", recordId)
      .neq("status", "archived");
    if (appCount && appCount > 0) {
      blockers.push(`${appCount} active application(s)`);
    }

    const { data: appRows } = await supabase
      .from("applications")
      .select("id")
      .eq("student_id", recordId);
    const appIds = (appRows ?? []).map((a) => a.id);

    const { count: docCount } = await supabase
      .from("student_documents")
      .select("id", { count: "exact", head: true })
      .eq("student_id", recordId)
      .is("archived_at", null);
    if (docCount && docCount > 0) {
      blockers.push(`${docCount} document(s)`);
    }

    if (appIds.length > 0) {
      const { count: contractCount } = await supabase
        .from("contracts")
        .select("id", { count: "exact", head: true })
        .in("application_id", appIds)
        .is("archived_at", null);
      if (contractCount && contractCount > 0) {
        blockers.push(`${contractCount} contract(s)`);
      }

      const { count: feeCount } = await supabase
        .from("fee_schedules")
        .select("id", { count: "exact", head: true })
        .in("application_id", appIds)
        .is("archived_at", null);
      if (feeCount && feeCount > 0) {
        blockers.push(`${feeCount} fee schedule(s)`);
      }

      const { count: checklistCount } = await supabase
        .from("admission_checklists")
        .select("id", { count: "exact", head: true })
        .in("application_id", appIds);
      if (checklistCount && checklistCount > 0) {
        blockers.push(`${checklistCount} checklist record(s)`);
      }
    }

    if (blockers.length > 0) {
      return {
        safe: false,
        reason: `This student has active related records. Hard delete is blocked. Archive the student file instead, or resolve related records first.\n\nBlockers:\n- ${blockers.join("\n- ")}`,
      };
    }
  }

  const { data: snapshot } = await supabase
    .from(tableName)
    .select("*")
    .eq("id", recordId)
    .single();

  return {
    safe: true,
    reason: "",
    snapshot: snapshot as Record<string, unknown> | undefined,
  };
}

function revalidateRelatedPaths(tableName: string) {
  revalidatePath("/dashboard/students");
  revalidatePath("/dashboard/intake");
  revalidatePath("/dashboard/contracts");
  revalidatePath("/dashboard/checklists");
  revalidatePath("/dashboard/fees");
  revalidatePath("/dashboard/programs");
  revalidatePath("/dashboard/batches");

  if (tableName === "students" || tableName === "applications") {
    revalidatePath("/dashboard/students/[studentId]", "page");
  }
}

export async function getArchiveInfo(
  tableName: string,
  recordId: string
): Promise<{
  archived: boolean;
  archivedAt: string | null;
  archivedBy: string | null;
  archiveReason: string | null;
} | null> {
  if (!isArchivableTable(tableName)) return null;

  const supabase = await createClient();

  const { data } = await supabase
    .from(tableName)
    .select("archived_at, archived_by, archive_reason")
    .eq("id", recordId)
    .single();

  if (!data) return null;

  let archivedByName: string | null = null;
  if (data.archived_by) {
    const { data: p } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", data.archived_by)
      .single();
    archivedByName = p?.full_name || p?.email || data.archived_by;
  }

  return {
    archived: !!data.archived_at,
    archivedAt: data.archived_at,
    archivedBy: archivedByName,
    archiveReason: data.archive_reason,
  };
}

