import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import type { Category } from "@/lib/types";
import { CategoriesManager, type CategoryRow } from "./CategoriesManager";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("categories")
    .select("*, products(count)")
    .order("sort_order")
    .order("name");

  const rows: CategoryRow[] = ((data ?? []) as (Category & { products: { count: number }[] })[]).map(
    ({ products, ...c }) => ({ ...c, product_count: products?.[0]?.count ?? 0 }),
  );

  return <CategoriesManager categories={rows} error={error?.message} />;
}
