import Link from "next/link";
import type { ProductWithRelations } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { Reveal } from "./Reveal";

export function ProductGrid({ products }: { products: ProductWithRelations[] }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-28 text-center">
        <p className="font-script text-5xl leading-none">Nothing here yet</p>
        <p className="text-sm text-muted">New pieces are on their way. Try another filter in the meantime.</p>
        <Link href="/shop" className="btn-outline mt-4">
          See everything
        </Link>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-12 pt-10 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
      {products.map((p, i) => (
        <Reveal key={p.id} delay={(i % 4) * 0.06}>
          <ProductCard product={p} priority={i < 4} />
        </Reveal>
      ))}
    </div>
  );
}
