"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import type { ProductWithRelations } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";

export function ProductCard({
  product,
  priority = false,
  tileClassName = "aspect-[3/4]",
  showPrice = true,
}: {
  product: ProductWithRelations;
  priority?: boolean;
  tileClassName?: string;
  showPrice?: boolean;
}) {
  const add = useCart((s) => s.add);
  const [first, second] = product.images;
  const inStock = product.variants.filter((v) => v.stock > 0);
  const soldOut = inStock.length === 0;
  const onSale = product.compare_at_price && Number(product.compare_at_price) > Number(product.price);

  // Quick-add only when there is a single choice; otherwise go pick a size.
  function quickAdd() {
    if (inStock.length !== 1) return;
    const v = inStock[0];
    add({
      variantId: v.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      variantLabel: [v.size !== "One Size" ? v.size : null, v.color].filter(Boolean).join(" / "),
      price: Number(product.price),
      image: first ?? null,
      maxStock: v.stock,
    });
    toast(`${product.name} added to your bag`);
  }

  return (
    <div className="group">
      <Link href={`/product/${product.slug}`} className={cn("relative block overflow-hidden bg-paper-light", tileClassName)}>
        {first ? (
          <>
            <Image
              src={first}
              alt={product.name}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-all duration-[1.2s] ease-out-soft group-hover:scale-105"
            />
            {second && (
              <Image
                src={second}
                alt=""
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="grid h-full place-items-center">
            <Image src="/brand/logo-black.png" alt="" width={960} height={220} className="w-1/2 opacity-15" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {soldOut && <span className="bg-ink px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-paper">Sold out</span>}
          {!soldOut && onSale && <span className="bg-rose px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-white">Sale</span>}
        </div>
      </Link>
      <div className="mt-4 flex items-start justify-between gap-3">
        <Link href={`/product/${product.slug}`} className="min-w-0">
          <h3 className="font-serif text-[15px] leading-snug md:text-base">{product.name}</h3>
          {showPrice && (
            <p className="mt-1 text-[12px] tracking-[0.06em] text-ink/70">
              {onSale && <span className="mr-2 text-rose">{formatPrice(product.price)}</span>}
              {onSale ? <span className="text-muted line-through">{formatPrice(product.compare_at_price)}</span> : formatPrice(product.price)}
            </p>
          )}
        </Link>
        {inStock.length === 1 ? (
          <button
            onClick={quickAdd}
            aria-label={`Add ${product.name} to bag`}
            className="-mr-2 grid size-10 shrink-0 place-items-center text-ink/70 transition-all duration-300 hover:rotate-90 hover:text-rose md:mr-0 md:size-7"
          >
            <Plus className="size-4" strokeWidth={1.4} />
          </button>
        ) : (
          <Link
            href={`/product/${product.slug}`}
            aria-label={`Choose options for ${product.name}`}
            className="-mr-2 grid size-10 shrink-0 place-items-center text-ink/70 transition-all duration-300 hover:rotate-90 hover:text-rose md:mr-0 md:size-7"
          >
            <Plus className="size-4" strokeWidth={1.4} />
          </Link>
        )}
      </div>
    </div>
  );
}
