"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { dbMessage, fail, revalidateCatalog, zodMessage, type ActionResult } from "../../_lib/action";

const updatesSchema = z
  .array(
    z.object({
      id: z.uuid(),
      stock: z.number().int("Stock must be a whole number").min(0, "Stock can't be negative").max(1_000_000),
      low_stock_threshold: z.number().int().min(0).max(1_000_000).optional(),
    }),
  )
  .min(1, "Nothing to save")
  .max(500);

export type StockUpdate = z.input<typeof updatesSchema>[number];

export async function updateStock(updates: StockUpdate[]): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = updatesSchema.safeParse(updates);
  if (!parsed.success) return fail(zodMessage(parsed.error));

  const results = await Promise.all(
    parsed.data.map(({ id, ...fields }) => supabase.from("product_variants").update(fields).eq("id", id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return fail(dbMessage(failed.error));

  revalidateCatalog();
  return { ok: true };
}
