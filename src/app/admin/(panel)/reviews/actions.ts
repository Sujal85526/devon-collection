"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { dbMessage, fail, revalidateCatalog, zodMessage, type ActionResult } from "../../_lib/action";

const id = z.uuid();

export async function setReviewStatus(reviewId: string, status: "pending" | "approved" | "rejected"): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = z.object({ id, status: z.enum(["pending", "approved", "rejected"]) }).safeParse({ id: reviewId, status });
  if (!parsed.success) return fail(zodMessage(parsed.error));
  const { error } = await supabase.from("reviews").update({ status: parsed.data.status }).eq("id", parsed.data.id);
  if (error) return fail(dbMessage(error));
  revalidateCatalog();
  return { ok: true };
}

export async function saveReviewReply(reviewId: string, reply: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = z
    .object({ id, reply: z.string().trim().max(2000, "Reply is too long") })
    .safeParse({ id: reviewId, reply });
  if (!parsed.success) return fail(zodMessage(parsed.error));
  const { error } = await supabase
    .from("reviews")
    .update({ admin_reply: parsed.data.reply || null })
    .eq("id", parsed.data.id);
  if (error) return fail(dbMessage(error));
  revalidateCatalog();
  return { ok: true };
}

export async function deleteReview(reviewId: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!id.safeParse(reviewId).success) return fail("Invalid review");
  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
  if (error) return fail(dbMessage(error));
  revalidateCatalog();
  return { ok: true };
}
