import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { ProductForm } from "../ProductForm";
import { loadFormOptions } from "../_data";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const { supabase } = await requireAdmin();
  const { categories, productTypes } = await loadFormOptions(supabase);
  return <ProductForm categories={categories} productTypes={productTypes} />;
}
