import type { SupabaseClient } from "@supabase/supabase-js";

/** Categories and already-used product types for the product form selects. */
export async function loadFormOptions(supabase: SupabaseClient) {
  const [{ data: categories }, { data: types }] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order").order("name"),
    supabase.from("products").select("product_type").not("product_type", "is", null),
  ]);
  return {
    categories: (categories ?? []) as { id: string; name: string }[],
    productTypes: Array.from(new Set((types ?? []).map((t) => t.product_type as string).filter(Boolean))),
  };
}
