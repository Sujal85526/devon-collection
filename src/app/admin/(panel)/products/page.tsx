import type { Metadata } from "next";
import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import { Badge, Card, EmptyState, MobileList, PageHeader, TableWrap } from "@/components/admin/ui";
import { FilterBar } from "@/components/admin/FilterBar";
import { Thumb } from "@/components/admin/Thumb";
import { ui } from "@/components/admin/styles";
import { searchTerm } from "../../_lib/dates";
import { ProductRowActions, ProductFlagToggle } from "./ProductRowActions";

export const metadata: Metadata = { title: "Products" };

type Row = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  product_type: string | null;
  category: { id: string; name: string } | null;
  variants: { stock: number; low_stock_threshold: number }[];
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; status?: string }>;
}) {
  const { q = "", category = "", status = "" } = await searchParams;
  const { supabase } = await requireAdmin();

  let query = supabase
    .from("products")
    .select(
      "id, name, slug, price, compare_at_price, images, is_active, is_featured, product_type, category:categories(id, name), variants:product_variants(stock, low_stock_threshold)",
    )
    .order("created_at", { ascending: false });

  const term = searchTerm(q);
  if (term) query = query.ilike("name", `%${term}%`);
  if (category === "none") query = query.is("category_id", null);
  else if (category) query = query.eq("category_id", category);
  if (status === "active") query = query.eq("is_active", true);
  if (status === "draft") query = query.eq("is_active", false);
  if (status === "featured") query = query.eq("is_featured", true);

  const [{ data, error }, { data: categories }] = await Promise.all([
    query,
    supabase.from("categories").select("id, name").order("sort_order").order("name"),
  ]);
  const products = (data ?? []) as unknown as Row[];
  const filtered = Boolean(term || category || status);

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Products"
        description={`${products.length} product${products.length === 1 ? "" : "s"}${filtered ? " match your filters" : ""}`}
        actions={
          <Link href="/admin/products/new" className={ui.btn}>
            <Plus size={14} /> New product
          </Link>
        }
      />

      <FilterBar
        className="mb-4"
        values={{ q, category, status }}
        searchPlaceholder="Search products by name…"
        selects={[
          {
            name: "category",
            label: "All categories",
            options: [
              ...(categories ?? []).map((c) => ({ value: c.id as string, label: c.name as string })),
              { value: "none", label: "Uncategorised" },
            ],
          },
          {
            name: "status",
            label: "Any status",
            options: [
              { value: "active", label: "Active" },
              { value: "draft", label: "Draft" },
              { value: "featured", label: "Best sellers" },
            ],
          },
        ]}
      />

      {error && <p className="mb-4 bg-red-50 px-4 py-3 text-sm text-red-700">{error.message}</p>}

      <Card>
        {products.length === 0 ? (
          <EmptyState
            icon={<Package size={20} />}
            title={filtered ? "No matching products" : "No products yet"}
            description={filtered ? "Try a different search or clear the filters." : "Add your first product to start selling."}
            action={
              !filtered && (
                <Link href="/admin/products/new" className={ui.btn}>
                  <Plus size={14} /> New product
                </Link>
              )
            }
          />
        ) : (
          <>
          <MobileList>
            {products.map((p) => {
              const stock = p.variants.reduce((s, v) => s + v.stock, 0);
              const anyLow = p.variants.some((v) => v.stock <= v.low_stock_threshold);
              return (
                <li key={p.id} className="flex gap-3 px-4 py-3.5">
                  <Link href={`/admin/products/${p.id}`} className="shrink-0" tabIndex={-1} aria-hidden>
                    <Thumb src={p.images[0]} alt="" size={56} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/admin/products/${p.id}`} className="min-w-0">
                        <span className="line-clamp-2 font-medium leading-snug text-ink">{p.name}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          {p.category?.name ?? <span className="italic">Uncategorised</span>}
                          {p.product_type && ` · ${p.product_type}`}
                        </span>
                      </Link>
                      <span className="shrink-0 text-right text-sm font-medium tabular-nums text-ink">
                        {formatPrice(p.price)}
                        {p.compare_at_price && p.compare_at_price > p.price && (
                          <span className="block text-xs font-normal text-muted line-through">
                            {formatPrice(p.compare_at_price)}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <span className="text-xs text-muted">
                        {p.variants.length === 0 ? (
                          <Badge tone="neutral">No variants</Badge>
                        ) : stock === 0 ? (
                          <Badge tone="red">Out of stock</Badge>
                        ) : (
                          <>
                            <span className={anyLow ? "font-semibold text-[#b4532a]" : "font-medium text-ink"}>{stock}</span> in
                            stock{anyLow && " · low"}
                          </>
                        )}
                      </span>
                      <div className="-mr-2">
                        <ProductRowActions id={p.id} name={p.name} />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-5">
                      <ProductFlagToggle id={p.id} flag="is_active" value={p.is_active} />
                      <ProductFlagToggle id={p.id} flag="is_featured" value={p.is_featured} named />
                    </div>
                  </div>
                </li>
              );
            })}
          </MobileList>
          <TableWrap className="hidden md:block">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th className="text-right">Price</th>
                <th className="text-right">Stock</th>
                <th>Active</th>
                <th>Best seller</th>
                <th className="w-px" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const stock = p.variants.reduce((s, v) => s + v.stock, 0);
                const anyLow = p.variants.some((v) => v.stock <= v.low_stock_threshold);
                return (
                  <tr key={p.id} className="hover:bg-paper-light/60">
                    <td>
                      <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                        <Thumb src={p.images[0]} alt={p.name} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-ink hover:underline">{p.name}</span>
                          <span className="block text-xs text-muted">{p.product_type ?? "—"}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="text-muted">{p.category?.name ?? <span className="italic">Uncategorised</span>}</td>
                    <td className="whitespace-nowrap text-right tabular-nums">
                      {formatPrice(p.price)}
                      {p.compare_at_price && p.compare_at_price > p.price && (
                        <span className="block text-xs text-muted line-through">{formatPrice(p.compare_at_price)}</span>
                      )}
                    </td>
                    <td className="text-right tabular-nums">
                      {p.variants.length === 0 ? (
                        <Badge tone="neutral">No variants</Badge>
                      ) : stock === 0 ? (
                        <Badge tone="red">Out</Badge>
                      ) : (
                        <span className={anyLow ? "font-semibold text-[#b4532a]" : ""}>{stock}</span>
                      )}
                    </td>
                    <td>
                      <ProductFlagToggle id={p.id} flag="is_active" value={p.is_active} />
                    </td>
                    <td>
                      <ProductFlagToggle id={p.id} flag="is_featured" value={p.is_featured} />
                    </td>
                    <td>
                      <ProductRowActions id={p.id} name={p.name} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
          </>
        )}
      </Card>
    </>
  );
}
