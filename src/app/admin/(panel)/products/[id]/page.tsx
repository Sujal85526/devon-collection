import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import type { Product, Variant } from "@/lib/types";
import { ProductForm } from "../ProductForm";
import { loadFormOptions } from "../_data";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireAdmin();

  const [{ data: product }, { data: variants }, options] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("product_variants").select("*").eq("product_id", id).order("sort_order").order("created_at"),
    loadFormOptions(supabase),
  ]);
  if (!product) notFound();

  return (
    <ProductForm
      // Remount after each save so freshly inserted variants pick up their ids.
      key={`${product.id}-${product.updated_at}`}
      product={product as Product}
      variants={(variants ?? []) as Variant[]}
      categories={options.categories}
      productTypes={options.productTypes}
    />
  );
}
