"use client";

import { Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import type { ProductWithRelations } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductPurchase({ product }: { product: ProductWithRelations }) {
  const add = useCart((s) => s.add);
  const variants = product.variants;
  const colors = useMemo(() => [...new Set(variants.map((v) => v.color).filter(Boolean) as string[])], [variants]);
  const [color, setColor] = useState<string | null>(colors[0] ?? null);
  const forColor = variants.filter((v) => !colors.length || v.color === color);
  const showSizes = !(forColor.length === 1 && forColor[0].size === "One Size");
  const firstAvailable = forColor.find((v) => v.stock > 0) ?? forColor[0];
  const [variantId, setVariantId] = useState<string | undefined>();
  const [qty, setQty] = useState(1);

  // Single-size products need no size pick.
  const effectiveId = showSizes ? variantId : firstAvailable?.id;
  const selected = forColor.find((v) => v.id === effectiveId);
  const soldOut = variants.every((v) => v.stock <= 0);

  function addToBag() {
    if (!selected) {
      toast("Please choose a length");
      return;
    }
    add(
      {
        variantId: selected.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        variantLabel: [selected.size !== "One Size" ? selected.size : null, selected.color].filter(Boolean).join(" / "),
        price: Number(product.price),
        image: product.images[0] ?? null,
        maxStock: selected.stock,
      },
      qty,
    );
  }

  return (
    <div className="space-y-7">
      {colors.length > 0 && (
        <div>
          <p className="label">
            Colour <span className="ml-1 font-normal normal-case tracking-normal text-ink">{color}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  setVariantId(undefined);
                }}
                className={cn(
                  "border px-4 py-2.5 text-xs transition-colors",
                  c === color ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {showSizes && (
        <div>
          <p className="label">Length <span className="ml-1 font-normal normal-case tracking-normal text-muted">(inches)</span></p>
          <div className="flex flex-wrap gap-2">
            {forColor.map((v) => (
              <button
                key={v.id}
                disabled={v.stock <= 0}
                onClick={() => {
                  setVariantId(v.id);
                  setQty(1);
                }}
                className={cn(
                  "min-w-14 border px-4 py-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:text-ink/30 disabled:line-through",
                  v.id === variantId ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink",
                )}
              >
                {v.size}
              </button>
            ))}
          </div>
          {selected && selected.stock <= selected.low_stock_threshold && (
            <p className="mt-3 text-xs text-alert">Only {selected.stock} left</p>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex items-center border border-line bg-white">
          <button className="px-3 py-3.5 hover:bg-ink/5" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>
            <Minus className="size-3.5" />
          </button>
          <span className="w-8 text-center text-sm tabular-nums">{qty}</span>
          <button
            className="px-3 py-3.5 hover:bg-ink/5 disabled:opacity-30"
            aria-label="Increase quantity"
            disabled={selected ? qty >= selected.stock : false}
            onClick={() => setQty((q) => q + 1)}
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        <button onClick={addToBag} disabled={soldOut} className="btn-primary flex-1">
          {soldOut ? "Sold out" : "Add to bag"}
        </button>
      </div>
    </div>
  );
}
