import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

// ADMIN-SIGNATURE-01: admin-only signature status changes.
//
// Supports three actions:
// - activate:   set is_active = true
// - deactivate: set is_active = false (and clear is_default, since an inactive
//               signature should never remain the default)
// - set_default: mark one signature as the default, clearing any existing
//                default first. Only an active signature can become default.
//
// There is no hard delete in this ticket.

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

type StatusAction = "activate" | "deactivate" | "set_default";

export async function POST(request: NextRequest) {
  const profile = await getUserProfile();
  if (!profile) {
    return bad("Unauthorized.", 401);
  }
  if (!isAdminOrSuper(profile.role)) {
    return bad("Only admin or super admin users can manage signatures.", 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request body.");
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return bad("Missing signature id.");
  }

  const action = body.action as StatusAction;
  if (!["activate", "deactivate", "set_default"].includes(action)) {
    return bad("Invalid action.");
  }

  const supabase = await createClient();

  // Confirm the signature exists (and read current state for set_default).
  const { data: signature, error: lookupError } = await supabase
    .from("admin_signatures")
    .select("id, is_active")
    .eq("id", id)
    .single();

  if (lookupError || !signature) {
    return bad("Signature not found.", 404);
  }

  if (action === "activate") {
    const { error } = await supabase
      .from("admin_signatures")
      .update({ is_active: true })
      .eq("id", id);
    if (error) {
      console.error("Signature activate failed:", error.message);
      return bad("Could not activate the signature. Please try again.", 500);
    }
  } else if (action === "deactivate") {
    const { error } = await supabase
      .from("admin_signatures")
      .update({ is_active: false, is_default: false })
      .eq("id", id);
    if (error) {
      console.error("Signature deactivate failed:", error.message);
      return bad("Could not deactivate the signature. Please try again.", 500);
    }
  } else {
    // set_default
    if (!signature.is_active) {
      return bad("Activate the signature before setting it as the default.");
    }
    // Clear any existing default first, then set this one. The partial unique
    // index guarantees only one default can exist even if these run apart.
    const { error: clearError } = await supabase
      .from("admin_signatures")
      .update({ is_default: false })
      .eq("is_default", true);
    if (clearError) {
      console.error("Clearing existing default failed:", clearError.message);
      return bad("Could not update the default signature. Please try again.", 500);
    }
    const { error: setError } = await supabase
      .from("admin_signatures")
      .update({ is_default: true })
      .eq("id", id);
    if (setError) {
      console.error("Setting default failed:", setError.message);
      return bad("Could not set the default signature. Please try again.", 500);
    }
  }

  revalidatePath("/dashboard/admin-tools/utilities/signatures");

  return NextResponse.json({ ok: true });
}
