import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { InventoryTable, type InventoryRow } from "./InventoryTable";

export const metadata: Metadata = { title: "Inventory" };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string }> }) {
  const { filter = "all", q = "" } = await searchParams;
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("product_variants")
    .select("id, size, color, sku, stock, low_stock_threshold, sort_order, product:products(id, name, images, is_active)")
    .order("product_id")
    .order("sort_order");

  const all = ((data ?? []) as unknown as InventoryRow[]).sort(
    (a, b) => (a.product?.name ?? "").localeCompare(b.product?.name ?? "") || a.sort_order - b.sort_order,
  );
  const counts = {
    all: all.length,
    low: all.filter((v) => v.stock > 0 && v.stock <= v.low_stock_threshold).length,
    out: all.filter((v) => v.stock === 0).length,
  };

  const term = q.trim().toLowerCase();
  const rows = all.filter((v) => {
    if (filter === "low" && !(v.stock > 0 && v.stock <= v.low_stock_threshold)) return false;
    if (filter === "out" && v.stock !== 0) return false;
    if (!term) return true;
    return (
      (v.product?.name ?? "").toLowerCase().includes(term) ||
      (v.sku ?? "").toLowerCase().includes(term) ||
      (v.color ?? "").toLowerCase().includes(term)
    );
  });

  return (
    <InventoryTable
      rows={rows}
      counts={counts}
      filter={filter === "low" || filter === "out" ? filter : "all"}
      q={q}
      error={error?.message}
    />
  );
}
