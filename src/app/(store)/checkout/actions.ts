"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function checkCoupon(code: string, subtotal: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("validate_coupon", { p_code: code, p_subtotal: subtotal });
  if (error || !data) return { valid: false, message: "Could not check this code right now." } as const;
  return data as { valid: boolean; message: string; code?: string; discount?: number };
}

const OrderInput = z.object({
  items: z
    .array(z.object({ variant_id: z.uuid(), quantity: z.number().int().min(1).max(20) }))
    .min(1, "Your bag is empty."),
  customer: z.object({
    email: z.email("Please enter a valid email."),
    full_name: z.string().trim().min(2, "Please enter your full name."),
    phone: z.string().trim().min(7, "Please enter a phone number we can reach you on."),
    payment_method: z.enum(["cod"]),
    address: z.object({
      line1: z.string().trim().min(3, "Please enter your street address."),
      line2: z.string().trim().optional(),
      city: z.string().trim().min(2, "Please enter your city / area."),
      emirate: z.string().trim().min(2),
      country: z.string().default("United Arab Emirates"),
      notes: z.string().trim().max(500).optional(),
    }),
  }),
  coupon: z.string().trim().max(40).optional(),
});

export type PlaceOrderResult = { ok: true; orderNumber: string; email: string } | { ok: false; error: string };

export async function placeOrder(input: z.input<typeof OrderInput>): Promise<PlaceOrderResult> {
  const parsed = OrderInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_order", {
    p_items: parsed.data.items,
    p_customer: parsed.data.customer,
    p_coupon: parsed.data.coupon || null,
  });
  if (error) {
    // Messages raised inside place_order are written for customers; anything else gets a generic message.
    const friendly = error.code === "P0001" ? error.message : "We couldn't place your order. Please try again.";
    return { ok: false, error: friendly };
  }
  // Stock changed — refresh product pages.
  revalidatePath("/", "layout");
  return { ok: true, orderNumber: data.order_number, email: parsed.data.customer.email.toLowerCase() };
}
