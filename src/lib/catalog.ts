import { createPublicClient } from "@/lib/supabase/public";
import { DEMO_CATEGORIES, DEMO_PRODUCTS, DEMO_REVIEWS } from "@/lib/demo-catalog";
import type { Category, ProductWithRelations, Review } from "@/lib/types";

const PRODUCT_SELECT = "*, category:categories(id, name, slug), variants:product_variants(*)";

function sortVariants(p: ProductWithRelations) {
  p.variants?.sort((a, b) => a.sort_order - b.sort_order);
  return p;
}

export async function getCategories(): Promise<Category[]> {
  const supabase = createPublicClient();
  if (!supabase) return DEMO_CATEGORIES;
  const { data } = await supabase.from("categories").select("*").eq("is_active", true).order("sort_order");
  return data ?? [];
}

export async function getCategory(slug: string): Promise<Category | null> {
  const supabase = createPublicClient();
  if (!supabase) return DEMO_CATEGORIES.find((c) => c.slug === slug) ?? null;
  const { data } = await supabase.from("categories").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
  return data;
}

type ProductQuery = {
  categorySlug?: string;
  type?: string;
  q?: string;
  featured?: boolean;
  sort?: "new" | "price-asc" | "price-desc";
  limit?: number;
};

/** The same filters and sorting as getProducts, applied to the built-in demo catalogue. */
function demoProducts(opts: ProductQuery) {
  const q = opts.q?.toLowerCase();
  let list = DEMO_PRODUCTS.filter(
    (p) =>
      (!opts.categorySlug || p.category?.slug === opts.categorySlug) &&
      (!opts.type || p.product_type === opts.type) &&
      (!opts.featured || p.is_featured) &&
      (!q || p.name.toLowerCase().includes(q)),
  );
  if (opts.sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
  else if (opts.sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
  return opts.limit ? list.slice(0, opts.limit) : list;
}

export async function getProducts(opts: ProductQuery = {}): Promise<ProductWithRelations[]> {
  const supabase = createPublicClient();
  if (!supabase) return demoProducts(opts);

  let categoryId: string | undefined;
  if (opts.categorySlug) {
    const category = await getCategory(opts.categorySlug);
    if (!category) return [];
    categoryId = category.id;
  }

  let query = supabase.from("products").select(PRODUCT_SELECT).eq("is_active", true);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (opts.type) query = query.eq("product_type", opts.type);
  if (opts.featured) query = query.eq("is_featured", true);
  if (opts.q) query = query.ilike("name", `%${opts.q.replace(/[%_,()]/g, " ")}%`);

  if (opts.sort === "price-asc") query = query.order("price", { ascending: true });
  else if (opts.sort === "price-desc") query = query.order("price", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  if (opts.limit) query = query.limit(opts.limit);

  const { data } = await query;
  return ((data ?? []) as ProductWithRelations[]).map(sortVariants);
}

export async function getProduct(slug: string): Promise<ProductWithRelations | null> {
  const supabase = createPublicClient();
  if (!supabase) return DEMO_PRODUCTS.find((p) => p.slug === slug) ?? null;
  const { data } = await supabase.from("products").select(PRODUCT_SELECT).eq("slug", slug).eq("is_active", true).maybeSingle();
  return data ? sortVariants(data as ProductWithRelations) : null;
}

export async function getProductTypes(): Promise<string[]> {
  const supabase = createPublicClient();
  if (!supabase) return [...new Set(DEMO_PRODUCTS.map((p) => p.product_type).filter(Boolean) as string[])].sort();
  const { data } = await supabase.from("products").select("product_type").eq("is_active", true);
  return [...new Set((data ?? []).map((r) => r.product_type).filter(Boolean) as string[])].sort();
}

export async function getApprovedReviews(productId: string): Promise<Review[]> {
  const supabase = createPublicClient();
  if (!supabase) return DEMO_REVIEWS.filter((r) => r.product_id === productId);
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getStoreSettings() {
  const supabase = createPublicClient();
  const fallback = { shipping_flat: 30, free_shipping_threshold: 500, currency: "AED", store_open: true };
  if (!supabase) return fallback;
  const { data } = await supabase
    .from("store_settings")
    .select("shipping_flat, free_shipping_threshold, currency, store_open")
    .eq("id", 1)
    .maybeSingle();
  return data ? { ...data, shipping_flat: Number(data.shipping_flat), free_shipping_threshold: Number(data.free_shipping_threshold) } : fallback;
}
