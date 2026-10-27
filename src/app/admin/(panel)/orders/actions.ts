"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/types";
import { dbMessage, fail, zodMessage, type ActionResult } from "../../_lib/action";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v ? v : null));

const orderSchema = z.object({
  id: z.uuid(),
  status: z.enum(ORDER_STATUSES),
  payment_status: z.enum(PAYMENT_STATUSES),
  carrier: optionalText(80),
  tracking_number: optionalText(120),
  notes: optionalText(4000),
  event_note: optionalText(500),
});

export type OrderUpdateInput = z.input<typeof orderSchema>;

export async function updateOrder(input: OrderUpdateInput): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return fail(zodMessage(parsed.error));
  const { id, event_note, ...fields } = parsed.data;

  const { data: before, error: readError } = await supabase.from("orders").select("status").eq("id", id).single();
  if (readError || !before) return fail(dbMessage(readError ?? { message: "Order not found" }));

  // A DB trigger logs the status change in order_events and restocks on cancel/return.
  const { error } = await supabase.from("orders").update(fields).eq("id", id);
  if (error) return fail(dbMessage(error));

  if (event_note && before.status !== fields.status) {
    const { data: latest } = await supabase
      .from("order_events")
      .select("id")
      .eq("order_id", id)
      .eq("status", fields.status)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latest) await supabase.from("order_events").update({ note: event_note }).eq("id", latest.id);
  }

  revalidatePath("/admin", "layout");
  // Stock may have changed (cancel/return), and customers see order status in their account.
  revalidatePath("/", "layout");
  return { ok: true };
}
