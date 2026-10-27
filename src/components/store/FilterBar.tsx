"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = { categories?: Pick<Category, "slug" | "name">[]; types: string[]; activeCategory?: string };

export function FilterBar({ categories, types, activeCategory }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }

  const chip = (active: boolean) =>
    cn(
      "whitespace-nowrap border px-5 py-2.5 text-[10px] font-medium uppercase tracking-[0.22em] transition-colors duration-300",
      active ? "border-ink bg-ink text-paper" : "border-line hover:border-ink",
    );

  return (
    <div className="flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-center md:justify-between">
      {categories ? (
        <div className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 md:mx-0 md:px-0">
          <Link href="/shop" className={chip(!activeCategory)} scroll={false}>
            All
          </Link>
          {categories.map((c) => (
            <Link key={c.slug} href={`/shop?category=${c.slug}`} className={chip(activeCategory === c.slug)} scroll={false}>
              {c.name}
            </Link>
          ))}
        </div>
      ) : (
        <div />
      )}
      <div className="flex gap-3">
        {types.length > 1 && (
          <select
            aria-label="Product type"
            value={params.get("type") ?? ""}
            onChange={(e) => update("type", e.target.value)}
            className="field min-w-0 flex-1 cursor-pointer border-line py-2.5 pl-5 text-base md:w-auto md:flex-none md:text-[11px] md:uppercase md:tracking-[0.15em]"
          >
            <option value="">All types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}
        <select
          aria-label="Sort"
          value={params.get("sort") ?? ""}
          onChange={(e) => update("sort", e.target.value)}
          className="field min-w-0 flex-1 cursor-pointer border-line py-2.5 pl-5 text-base md:w-auto md:flex-none md:text-[11px] md:uppercase md:tracking-[0.15em]"
        >
          <option value="">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </div>
    </div>
  );
}
