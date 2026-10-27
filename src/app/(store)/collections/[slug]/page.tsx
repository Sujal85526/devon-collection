import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FilterBar } from "@/components/store/FilterBar";
import { PageHero } from "@/components/store/PageHero";
import { ProductGrid } from "@/components/store/ProductGrid";
import { getCategory, getProducts } from "@/lib/catalog";

type Sort = "new" | "price-asc" | "price-desc";

export async function generateMetadata(props: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const category = await getCategory(slug);
  return { title: category?.name ?? "Collection", description: category?.tagline ?? undefined };
}

export default async function CollectionPage(props: PageProps<"/collections/[slug]">) {
  const { slug } = await props.params;
  const sp = await props.searchParams;
  const category = await getCategory(slug);
  if (!category) notFound();

  const products = await getProducts({
    categorySlug: slug,
    type: typeof sp.type === "string" ? sp.type : undefined,
    sort: (typeof sp.sort === "string" ? sp.sort : undefined) as Sort | undefined,
  });
  const allInCategory = sp.type ? await getProducts({ categorySlug: slug }) : products;
  const types = [...new Set(allInCategory.map((p) => p.product_type).filter(Boolean) as string[])].sort();

  return (
    <>
      <PageHero
        eyebrow="The collection"
        title={category.name}
        subtitle={category.description}
        image={category.image_url ?? undefined}
        alt={category.name}
      />

      <div className="mx-auto max-w-[1440px] px-5 pb-28 pt-10 md:px-10 md:pt-16">
        <Suspense>
          <FilterBar types={types} />
        </Suspense>
        <ProductGrid products={products} />
      </div>
    </>
  );
}
