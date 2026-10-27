"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { dbMessage, fail, zodMessage, type ActionResult } from "../../_lib/action";
import { revalidatePath } from "next/cache";

const isoOrNull = z
  .string()
  .nullable()
  .refine((v) => v === null || !Number.isNaN(Date.parse(v)), "Invalid date");

const couponSchema = z
  .object({
    id: z.uuid().optional(),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, "Code must be at least 3 characters")
      .max(32)
      .regex(/^[A-Z0-9_-]+$/, "Use letters, numbers, dashes or underscores"),
    description: z
      .string()
      .trim()
      .max(200)
      .nullable()
      .transform((v) => (v ? v : null)),
    discount_type: z.enum(["percent", "fixed"]),
    value: z.number().positive("Value must be greater than 0"),
    min_order_amount: z.number().min(0),
    max_discount: z.number().positive().nullable(),
    usage_limit: z.number().int().positive().nullable(),
    starts_at: isoOrNull,
    expires_at: isoOrNull,
    is_active: z.boolean(),
  })
  .refine((c) => c.discount_type !== "percent" || c.value <= 100, {
    message: "A percentage can't exceed 100",
    path: ["value"],
  })
  .refine((c) => !c.starts_at || !c.expires_at || Date.parse(c.expires_at) > Date.parse(c.starts_at), {
    message: "Expiry must be after the start date",
    path: ["expires_at"],
  });

export type CouponInput = z.input<typeof couponSchema>;

function revalidate() {
  revalidatePath("/admin/coupons");
}

export async function saveCoupon(input: CouponInput): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return fail(zodMessage(parsed.error));
  const { id, ...fields } = parsed.data;
  const { error } = id
    ? await supabase.from("coupons").update(fields).eq("id", id)
    : await supabase.from("coupons").insert(fields);
  if (error) return fail(dbMessage(error));
  revalidate();
  return { ok: true };
}

export async function setCouponActive(id: string, isActive: boolean): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = z.object({ id: z.uuid(), isActive: z.boolean() }).safeParse({ id, isActive });
  if (!parsed.success) return fail(zodMessage(parsed.error));
  const { error } = await supabase.from("coupons").update({ is_active: parsed.data.isActive }).eq("id", parsed.data.id);
  if (error) return fail(dbMessage(error));
  revalidate();
  return { ok: true };
}

export async function deleteCoupon(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!z.uuid().safeParse(id).success) return fail("Invalid coupon");
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) return fail(dbMessage(error));
  revalidate();
  return { ok: true };
}
