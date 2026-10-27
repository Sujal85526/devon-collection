"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { dbMessage, fail, revalidateCatalog, zodMessage, type ActionResult } from "../../_lib/action";

const optionalText = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((v) => (v ? v : null));

const categorySchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1, "Name is required").max(80),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes"),
  tagline: optionalText,
  description: optionalText,
  image_url: z.url().nullable(),
  sort_order: z.number().int().min(-1000).max(1000),
  is_featured: z.boolean(),
  is_active: z.boolean(),
});

export type CategoryInput = z.input<typeof categorySchema>;

export async function saveCategory(input: CategoryInput): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return fail(zodMessage(parsed.error));
  const { id, ...fields } = parsed.data;

  const { error } = id
    ? await supabase.from("categories").update(fields).eq("id", id)
    : await supabase.from("categories").insert(fields);
  if (error) return fail(dbMessage(error));

  revalidateCatalog();
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!z.uuid().safeParse(id).success) return fail("Invalid category");
  // products.category_id is ON DELETE SET NULL, so products become uncategorised.
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return fail(dbMessage(error));
  revalidateCatalog();
  return { ok: true };
}
