"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { dbMessage, fail, revalidateCatalog, zodMessage, type ActionResult, type ActionResultWith } from "../../_lib/action";

const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional()
  .transform((v) => v ?? null);

const variantSchema = z.object({
  id: z.uuid().optional(),
  size: z.string().trim().min(1, "Size is required").max(40),
  color: optionalText,
  sku: optionalText,
  stock: z.number().int("Stock must be a whole number").min(0, "Stock can't be negative"),
  low_stock_threshold: z.number().int().min(0),
});

const productSchema = z
  .object({
    id: z.uuid().optional(),
    name: z.string().trim().min(1, "Name is required").max(160),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes"),
    category_id: z.uuid().nullable(),
    product_type: optionalText,
    price: z.number().min(0, "Price can't be negative"),
    compare_at_price: z.number().min(0).nullable(),
    description: optionalText,
    details: optionalText,
    is_active: z.boolean(),
    is_featured: z.boolean(),
    images: z.array(z.url()).max(20),
    variants: z.array(variantSchema).max(100),
  })
  .superRefine((p, ctx) => {
    const skus = p.variants.map((v) => v.sku).filter((s): s is string => Boolean(s));
    const dup = skus.find((s, i) => skus.indexOf(s) !== i);
    if (dup) ctx.addIssue({ code: "custom", message: `SKU "${dup}" is used twice`, path: ["variants"] });
    const combos = p.variants.map((v) => `${v.size.toLowerCase()}|${(v.color ?? "").toLowerCase()}`);
    const dupCombo = combos.findIndex((c, i) => combos.indexOf(c) !== i);
    if (dupCombo >= 0)
      ctx.addIssue({ code: "custom", message: "Two variants have the same size and colour", path: ["variants"] });
  });

export type ProductInput = z.input<typeof productSchema>;

export async function saveProduct(input: ProductInput): Promise<ActionResultWith<{ id: string }>> {
  const { supabase } = await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return fail(zodMessage(parsed.error));
  const { id, variants, ...fields } = parsed.data;

  let productId = id;
  if (productId) {
    const { error } = await supabase.from("products").update(fields).eq("id", productId);
    if (error) return fail(dbMessage(error));
  } else {
    const { data, error } = await supabase.from("products").insert(fields).select("id").single();
    if (error || !data) return fail(dbMessage(error ?? { message: "Could not create product" }));
    productId = data.id as string;
  }

  // Sync variants: delete removed, update existing, insert new.
  const { data: existing, error: existingError } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);
  if (existingError) return fail(dbMessage(existingError));

  const keep = new Set(variants.filter((v) => v.id).map((v) => v.id));
  const removed = (existing ?? []).map((v) => v.id as string).filter((vid) => !keep.has(vid));
  if (removed.length) {
    // order_items.variant_id is ON DELETE SET NULL, so past orders keep their snapshot.
    const { error } = await supabase.from("product_variants").delete().in("id", removed);
    if (error) return fail(`Saved product, but couldn't remove variants: ${dbMessage(error)}`);
  }

  const rows = variants.map((v, i) => ({
    id: v.id,
    fields: {
      product_id: productId,
      size: v.size,
      color: v.color,
      sku: v.sku,
      stock: v.stock,
      low_stock_threshold: v.low_stock_threshold,
      sort_order: i,
    },
  }));
  const updates = rows.filter((r): r is typeof r & { id: string } => Boolean(r.id));
  const inserts = rows.filter((r) => !r.id).map((r) => r.fields);

  for (const { id: vid, fields: r } of updates) {
    const { error } = await supabase.from("product_variants").update(r).eq("id", vid).eq("product_id", productId);
    if (error) return fail(`Saved product, but a variant failed: ${dbMessage(error)}`);
  }
  if (inserts.length) {
    const { error } = await supabase.from("product_variants").insert(inserts);
    if (error) return fail(`Saved product, but adding variants failed: ${dbMessage(error)}`);
  }

  revalidateCatalog();
  return { ok: true, data: { id: productId } };
}

const idSchema = z.uuid();

export async function deleteProduct(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!idSchema.safeParse(id).success) return fail("Invalid product");
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return fail(dbMessage(error));
  revalidateCatalog();
  return { ok: true };
}

export async function setProductFlag(
  id: string,
  flag: "is_active" | "is_featured",
  value: boolean,
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = z
    .object({ id: z.uuid(), flag: z.enum(["is_active", "is_featured"]), value: z.boolean() })
    .safeParse({ id, flag, value });
  if (!parsed.success) return fail(zodMessage(parsed.error));
  const { error } = await supabase
    .from("products")
    .update({ [parsed.data.flag]: parsed.data.value })
    .eq("id", parsed.data.id);
  if (error) return fail(dbMessage(error));
  revalidateCatalog();
  return { ok: true };
}

export async function duplicateProduct(id: string): Promise<ActionResultWith<{ id: string }>> {
  const { supabase } = await requireAdmin();
  if (!idSchema.safeParse(id).success) return fail("Invalid product");

  const { data: source, error } = await supabase
    .from("products")
    .select("category_id, name, slug, description, details, product_type, price, compare_at_price, images, is_featured")
    .eq("id", id)
    .single();
  if (error || !source) return fail(dbMessage(error ?? { message: "Product not found" }));

  const suffix = Math.random().toString(36).slice(2, 6);
  const { data: copy, error: insertError } = await supabase
    .from("products")
    .insert({
      ...source,
      name: `${source.name} (copy)`,
      slug: `${source.slug}-copy-${suffix}`,
      is_active: false,
    })
    .select("id")
    .single();
  if (insertError || !copy) return fail(dbMessage(insertError ?? { message: "Could not duplicate" }));

  const { data: variants } = await supabase
    .from("product_variants")
    .select("size, color, stock, low_stock_threshold, sort_order")
    .eq("product_id", id);
  if (variants?.length) {
    const { error: vError } = await supabase
      .from("product_variants")
      .insert(variants.map((v) => ({ ...v, product_id: copy.id, sku: null, stock: 0 })));
    if (vError) return fail(`Duplicated, but variants failed: ${dbMessage(vError)}`);
  }

  revalidateCatalog();
  return { ok: true, data: { id: copy.id as string } };
}
