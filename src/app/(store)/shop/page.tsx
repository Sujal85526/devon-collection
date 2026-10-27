import type { Metadata } from "next";
import { Suspense } from "react";
import { FilterBar } from "@/components/store/FilterBar";
import { PageHero } from "@/components/store/PageHero";
import { ProductGrid } from "@/components/store/ProductGrid";
import { getCategories, getProducts, getProductTypes } from "@/lib/catalog";

export const metadata: Metadata = { title: "Shop" };

type Sort = "new" | "price-asc" | "price-desc";

export default async function ShopPage(props: PageProps<"/shop">) {
  const sp = await props.searchParams;
  const pick = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const category = pick("category");
  const q = pick("q");

  const [categories, types, products] = await Promise.all([
    getCategories(),
    getProductTypes(),
    getProducts({ categorySlug: category, type: pick("type"), q, sort: pick("sort") as Sort | undefined }),
  ]);
  const activeName = categories.find((c) => c.slug === category)?.name;

  return (
    <>
      <PageHero
        eyebrow="Devon Collection"
        title={q ? `“${q}”` : activeName ?? "All abayas"}
        subtitle={`${products.length} ${products.length === 1 ? "piece" : "pieces"}, each available in lengths 52 to 60.`}
      />
      <div className="mx-auto max-w-[1440px] px-5 pb-28 pt-8 md:px-10 md:pt-12">
        <Suspense>
          <FilterBar categories={categories} types={types} activeCategory={category} />
        </Suspense>
        <ProductGrid products={products} />
      </div>
    </>
  );
}
