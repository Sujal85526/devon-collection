"use server";

import { requireAdmin } from "@/lib/auth";
import { dbMessage, fail, revalidateCatalog, type ActionResult } from "../_lib/action";

/** Opens or closes the storefront (admin sidebar switch). */
export async function setStoreOpen(open: boolean): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("store_settings").update({ store_open: open }).eq("id", 1);
  if (error) return fail(dbMessage(error));
  revalidateCatalog();
  return { ok: true };
}
