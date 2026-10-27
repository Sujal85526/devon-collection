"use server";

import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const ReviewInput = z.object({
  productId: z.uuid(),
  name: z.string().trim().min(2, "Please add your name").max(80),
  email: z.email("Please enter a valid email").optional().or(z.literal("")),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(10, "Tell us a little more (10+ characters)").max(2000),
});

export type ReviewState = { ok: boolean; message: string } | null;

export async function submitReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const parsed = ReviewInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  if (!isSupabaseConfigured) return { ok: false, message: "Reviews open very soon — thank you for your patience." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const r = parsed.data;
  const { error } = await supabase.from("reviews").insert({
    product_id: r.productId,
    user_id: user?.id ?? null,
    author_name: r.name,
    author_email: r.email || user?.email || null,
    rating: r.rating,
    title: r.title || null,
    body: r.body,
  });
  if (error) return { ok: false, message: "We couldn't save your review. Please try again." };
  return { ok: true, message: "Thank you! Your review will appear once it has been approved." };
}
