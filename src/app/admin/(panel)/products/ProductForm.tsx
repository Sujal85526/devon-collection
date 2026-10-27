"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, ImagePlus, LoaderCircle, Plus, Trash, X } from "lucide-react";
import { toast } from "sonner";
import type { Category, Product, Variant } from "@/lib/types";
import { cn, slugify } from "@/lib/utils";
import { Card, CardHeader } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Toggle } from "@/components/admin/Toggle";
import { ui } from "@/components/admin/styles";
import { uploadImage } from "@/components/admin/upload";
import { deleteProduct, saveProduct, type ProductInput } from "./actions";

const DEFAULT_TYPES = ["T-Shirt", "Shirt", "Swim Shorts", "Cap", "Towel"];
const QUICK_SIZES = ["S", "M", "L", "XL"];

type VariantRow = {
  key: string;
  id?: string;
  size: string;
  color: string;
  sku: string;
  stock: string;
  low_stock_threshold: string;
};

function toRow(v: Variant): VariantRow {
  return {
    key: v.id,
    id: v.id,
    size: v.size,
    color: v.color ?? "",
    sku: v.sku ?? "",
    stock: String(v.stock),
    low_stock_threshold: String(v.low_stock_threshold),
  };
}

function newRow(size = "", color = ""): VariantRow {
  return { key: crypto.randomUUID(), size, color, sku: "", stock: "0", low_stock_threshold: "5" };
}

function toNumber(value: string) {
  const n = Number(value);
  return value.trim() === "" || Number.isNaN(n) ? NaN : n;
}

export function ProductForm({
  product,
  variants = [],
  categories,
  productTypes = [],
}: {
  product?: Product;
  variants?: Variant[];
  categories: Pick<Category, "id" | "name">[];
  productTypes?: string[];
}) {
  const router = useRouter();
  const isNew = !product;
  const [saving, startSaving] = useTransition();

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [productType, setProductType] = useState(product?.product_type ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [compareAt, setCompareAt] = useState(product?.compare_at_price != null ? String(product.compare_at_price) : "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [details, setDetails] = useState(product?.details ?? "");
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [rows, setRows] = useState<VariantRow[]>(() => variants.map(toRow));
  const fileInput = useRef<HTMLInputElement>(null);

  const types = Array.from(new Set([...DEFAULT_TYPES, ...productTypes])).sort();

  // ── Images ────────────────────────────────────────────────
  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setUploading((n) => n + list.length);
    await Promise.all(
      list.map(async (file) => {
        try {
          const url = await uploadImage(file, "products");
          setImages((prev) => [...prev, url]);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : `Couldn't upload ${file.name}`);
        } finally {
          setUploading((n) => n - 1);
        }
      }),
    );
  }

  function moveImage(index: number, dir: -1 | 1) {
    setImages((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  // ── Variants ──────────────────────────────────────────────
  function updateRow(key: string, patch: Partial<VariantRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function quickAddSizes() {
    setRows((prev) => {
      const existing = new Set(prev.map((r) => r.size.trim().toUpperCase()));
      const color = prev[0]?.color ?? "";
      const added = QUICK_SIZES.filter((s) => !existing.has(s)).map((s) => newRow(s, color));
      if (!added.length) toast.message("S, M, L and XL already exist");
      // Replace a single empty row instead of leaving it dangling.
      const base = prev.length === 1 && !prev[0].size.trim() && !prev[0].id ? [] : prev;
      return [...base, ...added];
    });
  }

  function generateSkus() {
    const prefix = (slug || slugify(name))
      .split("-")
      .filter(Boolean)
      .map((w) => w.slice(0, 3))
      .join("")
      .toUpperCase()
      .slice(0, 10);
    if (!prefix) {
      toast.error("Add a product name first");
      return;
    }
    setRows((prev) =>
      prev.map((r) => {
        if (r.sku.trim()) return r;
        const parts = [prefix, r.color && slugify(r.color).slice(0, 3).toUpperCase(), r.size && slugify(r.size).toUpperCase()];
        return { ...r, sku: `CR-${parts.filter(Boolean).join("-")}` };
      }),
    );
  }

  // ── Save ──────────────────────────────────────────────────
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (uploading > 0) {
      toast.error("Wait for images to finish uploading");
      return;
    }
    const priceNum = toNumber(price);
    if (Number.isNaN(priceNum)) {
      toast.error("Enter a valid price");
      return;
    }
    const compareNum = compareAt.trim() ? toNumber(compareAt) : null;
    if (compareNum !== null && Number.isNaN(compareNum)) {
      toast.error("Enter a valid compare-at price");
      return;
    }
    const variantInput: ProductInput["variants"] = [];
    for (const r of rows) {
      const stock = toNumber(r.stock);
      const threshold = toNumber(r.low_stock_threshold);
      if (!r.size.trim()) {
        toast.error("Every variant needs a size (use “One Size” if it doesn’t apply)");
        return;
      }
      if (!Number.isInteger(stock) || stock < 0 || !Number.isInteger(threshold) || threshold < 0) {
        toast.error(`Check the stock numbers for size ${r.size}`);
        return;
      }
      variantInput.push({
        id: r.id,
        size: r.size,
        color: r.color,
        sku: r.sku,
        stock,
        low_stock_threshold: threshold,
      });
    }

    const payload: ProductInput = {
      id: product?.id,
      name,
      slug: slug || slugify(name),
      category_id: categoryId || null,
      product_type: productType,
      price: priceNum,
      compare_at_price: compareNum,
      description,
      details,
      is_active: isActive,
      is_featured: isFeatured,
      images,
      variants: variantInput,
    };

    startSaving(async () => {
      const res = await saveProduct(payload);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(isNew ? "Product created" : "Product saved");
      if (isNew) router.replace(`/admin/products/${res.data.id}`);
      else router.refresh();
    });
  }

  const totalStock = rows.reduce((s, r) => s + (Number(r.stock) || 0), 0);

  return (
    <form onSubmit={onSubmit} className="pb-24">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/admin/products"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-ink/60 hover:text-ink"
          >
            <ArrowLeft size={14} /> Products
          </Link>
          <h1 className="break-words font-serif text-3xl text-ink sm:text-4xl">{isNew ? "New product" : name || "Untitled"}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {product && (
            <>
              <a href={`/product/${product.slug}`} target="_blank" rel="noreferrer" className={ui.btnGhost}>
                <ExternalLink size={14} /> View
              </a>
              <ConfirmButton
                className={ui.btnGhost}
                title="Delete product?"
                message={
                  <>
                    <strong>{product.name}</strong> and all its variants and reviews will be permanently deleted.
                  </>
                }
                action={() => deleteProduct(product.id)}
                successMessage="Product deleted"
                onDone={() => router.push("/admin/products")}
              >
                <Trash size={14} /> Delete
              </ConfirmButton>
            </>
          )}
          {/* Below lg the sticky bar at the bottom carries the primary action */}
          <button type="submit" className={cn(ui.btn, "max-lg:hidden")} disabled={saving || uploading > 0}>
            {saving && <LoaderCircle size={14} className="animate-spin" />}
            {isNew ? "Create product" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Details" />
            <div className="space-y-5 p-4 sm:p-5">
              <div>
                <label htmlFor="name" className={ui.label}>
                  Name
                </label>
                <input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slugTouched) setSlug(slugify(e.target.value));
                  }}
                  className={ui.input}
                  placeholder="Corniche Linen Shirt"
                />
              </div>
              <div>
                <label htmlFor="slug" className={ui.label}>
                  URL slug
                </label>
                <div className="flex items-stretch">
                  <span className="hidden items-center border border-r-0 border-ink/15 bg-paper-light px-3 text-xs text-muted sm:flex">
                    /product/
                  </span>
                  <input
                    id="slug"
                    required
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                    }}
                    onBlur={() => setSlug((s) => slugify(s))}
                    className={ui.input}
                  />
                </div>
                {slugTouched && name && slug !== slugify(name) && (
                  <button
                    type="button"
                    className="mt-1 text-xs text-rose hover:underline"
                    onClick={() => {
                      setSlug(slugify(name));
                      setSlugTouched(false);
                    }}
                  >
                    Reset from name
                  </button>
                )}
              </div>
              <div>
                <label htmlFor="description" className={ui.label}>
                  Description
                </label>
                <textarea
                  id="description"
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={ui.input}
                  placeholder="The story of the piece — where it's worn, how it feels."
                />
              </div>
              <div>
                <label htmlFor="details" className={ui.label}>
                  Fabric &amp; care
                </label>
                <textarea
                  id="details"
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className={ui.input}
                  placeholder={"100% organic cotton\nMachine wash cold\nDo not tumble dry"}
                />
                <p className={ui.hint}>One point per line.</p>
              </div>
            </div>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader
              title={`Images${images.length ? ` · ${images.length}` : ""}`}
              action={uploading > 0 && <span className="text-xs text-muted">Uploading {uploading}…</span>}
            />
            <div className="p-4 sm:p-5">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  void handleFiles(e.dataTransfer.files);
                }}
                className={cn(
                  "grid grid-cols-2 gap-3 sm:grid-cols-4",
                  dragOver && "outline-2 outline-dashed outline-offset-4 outline-rose",
                )}
              >
                {images.map((url, i) => (
                  <div key={url} className="group relative aspect-[4/5] overflow-hidden border border-ink/10 bg-paper-light">
                    <Image src={url} alt="" fill sizes="200px" className="object-cover" unoptimized />
                    {i === 0 && (
                      <span className="absolute left-2 top-2 bg-ink px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-paper">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                      className="absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center bg-white/90 text-ink/70 hover:text-red-600 sm:h-7 sm:w-7"
                      aria-label="Remove image"
                    >
                      <X size={14} />
                    </button>
                    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-ink/60 to-transparent p-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => moveImage(i, -1)}
                        disabled={i === 0}
                        className="flex h-9 w-9 items-center justify-center bg-white/90 text-ink disabled:opacity-30 sm:h-7 sm:w-7"
                        aria-label="Move left"
                      >
                        <ChevronLeft size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(i, 1)}
                        disabled={i === images.length - 1}
                        className="flex h-9 w-9 items-center justify-center bg-white/90 text-ink disabled:opacity-30 sm:h-7 sm:w-7"
                        aria-label="Move right"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                ))}
                {Array.from({ length: uploading }).map((_, i) => (
                  <div key={`up-${i}`} className="flex aspect-[4/5] items-center justify-center border border-ink/10 bg-paper-light">
                    <LoaderCircle size={20} className="animate-spin text-ink/40" />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="flex aspect-[4/5] flex-col items-center justify-center gap-2 border border-dashed border-ink/25 text-ink/50 transition-colors hover:border-ink hover:text-ink"
                >
                  <ImagePlus size={22} strokeWidth={1.5} />
                  <span className="text-[11px] font-medium">Add images</span>
                </button>
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  if (e.target.files) void handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <p className={cn(ui.hint, "mt-3")}>
                Drag &amp; drop or click to upload. The first image is the cover. JPG, PNG or WebP up to 8 MB.
              </p>
            </div>
          </Card>

          {/* Variants */}
          <Card>
            <CardHeader
              title={`Variants & stock${rows.length ? ` · ${totalStock} units` : ""}`}
              action={
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={quickAddSizes} className={ui.btnSmall}>
                    Quick add S–XL
                  </button>
                  {rows.length > 0 && (
                    <button type="button" onClick={generateSkus} className={ui.btnSmall}>
                      Fill SKUs
                    </button>
                  )}
                </div>
              }
            />
            <div className="p-4 sm:p-5">
              {rows.length === 0 ? (
                <div className="border border-dashed border-ink/20 px-4 py-8 text-center sm:px-6">
                  <p className="text-sm text-muted">
                    No variants yet. A product needs at least one variant to be purchasable.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button type="button" onClick={quickAddSizes} className={ui.btnSmall}>
                      Add S, M, L, XL
                    </button>
                    <button type="button" onClick={() => setRows([newRow("One Size")])} className={ui.btnSmall}>
                      One size
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Phones: one stacked card per variant */}
                  <ul className="space-y-3 md:hidden">
                    {rows.map((r) => {
                      const low = Number(r.stock) <= Number(r.low_stock_threshold);
                      return (
                        <li key={r.key} className="border border-ink/10 p-3">
                          <div className="flex items-start gap-2">
                            <div className="grid flex-1 grid-cols-2 gap-2">
                              <label className="block">
                                <span className={ui.label}>Size</span>
                                <input
                                  value={r.size}
                                  onChange={(e) => updateRow(r.key, { size: e.target.value })}
                                  className={ui.input}
                                  placeholder="M"
                                />
                              </label>
                              <label className="block">
                                <span className={ui.label}>Colour</span>
                                <input
                                  value={r.color}
                                  onChange={(e) => updateRow(r.key, { color: e.target.value })}
                                  className={ui.input}
                                  placeholder="Sand"
                                />
                              </label>
                            </div>
                            <button
                              type="button"
                              onClick={() => setRows((prev) => prev.filter((x) => x.key !== r.key))}
                              className={cn(ui.iconBtnDanger, "-mr-1 mt-5 shrink-0")}
                              aria-label={`Remove variant${r.size ? ` ${r.size}` : ""}`}
                            >
                              <Trash size={15} />
                            </button>
                          </div>
                          <label className="mt-2 block">
                            <span className={ui.label}>SKU</span>
                            <input
                              value={r.sku}
                              onChange={(e) => updateRow(r.key, { sku: e.target.value.toUpperCase() })}
                              className={cn(ui.input, "font-mono")}
                              placeholder="Optional"
                            />
                          </label>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <label className="block">
                              <span className={ui.label}>Stock</span>
                              <input
                                type="number"
                                min={0}
                                step={1}
                                inputMode="numeric"
                                value={r.stock}
                                onChange={(e) => updateRow(r.key, { stock: e.target.value })}
                                className={cn(ui.input, "tabular-nums", low && "border-alert/60 text-[#b4532a]")}
                              />
                            </label>
                            <label className="block">
                              <span className={ui.label}>Alert at</span>
                              <input
                                type="number"
                                min={0}
                                step={1}
                                inputMode="numeric"
                                value={r.low_stock_threshold}
                                onChange={(e) => updateRow(r.key, { low_stock_threshold: e.target.value })}
                                className={cn(ui.input, "tabular-nums")}
                              />
                            </label>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[620px] text-sm">
                    <thead>
                      <tr className="text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/50">
                        <th className="pb-2 pr-2 font-semibold">Size</th>
                        <th className="pb-2 pr-2 font-semibold">Colour</th>
                        <th className="pb-2 pr-2 font-semibold">SKU</th>
                        <th className="w-24 pb-2 pr-2 font-semibold">Stock</th>
                        <th className="w-24 pb-2 pr-2 font-semibold" title="Low stock threshold">
                          Alert at
                        </th>
                        <th className="w-8 pb-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => {
                        const low = Number(r.stock) <= Number(r.low_stock_threshold);
                        return (
                          <tr key={r.key}>
                            <td className="py-1 pr-2">
                              <input
                                value={r.size}
                                onChange={(e) => updateRow(r.key, { size: e.target.value })}
                                className={ui.input}
                                placeholder="M"
                                aria-label="Size"
                              />
                            </td>
                            <td className="py-1 pr-2">
                              <input
                                value={r.color}
                                onChange={(e) => updateRow(r.key, { color: e.target.value })}
                                className={ui.input}
                                placeholder="Sand"
                                aria-label="Colour"
                              />
                            </td>
                            <td className="py-1 pr-2">
                              <input
                                value={r.sku}
                                onChange={(e) => updateRow(r.key, { sku: e.target.value.toUpperCase() })}
                                className={cn(ui.input, "font-mono text-xs")}
                                placeholder="Optional"
                                aria-label="SKU"
                              />
                            </td>
                            <td className="py-1 pr-2">
                              <input
                                type="number"
                                min={0}
                                step={1}
                                inputMode="numeric"
                                value={r.stock}
                                onChange={(e) => updateRow(r.key, { stock: e.target.value })}
                                className={cn(ui.input, "tabular-nums", low && "border-alert/60 text-[#b4532a]")}
                                aria-label="Stock"
                              />
                            </td>
                            <td className="py-1 pr-2">
                              <input
                                type="number"
                                min={0}
                                step={1}
                                inputMode="numeric"
                                value={r.low_stock_threshold}
                                onChange={(e) => updateRow(r.key, { low_stock_threshold: e.target.value })}
                                className={cn(ui.input, "tabular-nums")}
                                aria-label="Low stock threshold"
                              />
                            </td>
                            <td className="py-1">
                              <button
                                type="button"
                                onClick={() => setRows((prev) => prev.filter((x) => x.key !== r.key))}
                                className={ui.iconBtnDanger}
                                aria-label="Remove variant"
                              >
                                <Trash size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRows((prev) => [...prev, newRow("", prev[prev.length - 1]?.color ?? "")])}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-rose hover:underline max-md:min-h-10"
                  >
                    <Plus size={14} /> Add variant
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Visibility" />
            <div className="space-y-4 p-4 sm:p-5">
              <Toggle
                checked={isActive}
                onChange={setIsActive}
                label={isActive ? "Active" : "Draft"}
                description="Active products are visible in the shop."
              />
              <Toggle
                checked={isFeatured}
                onChange={setIsFeatured}
                label="Best seller"
                description="Featured on the homepage and tagged in the shop."
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Pricing" />
            <div className="space-y-4 p-4 sm:p-5">
              <div>
                <label htmlFor="price" className={ui.label}>
                  Price (AED)
                </label>
                <input
                  id="price"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={cn(ui.input, "tabular-nums")}
                  placeholder="185"
                />
              </div>
              <div>
                <label htmlFor="compare" className={ui.label}>
                  Compare-at price (AED)
                </label>
                <input
                  id="compare"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={compareAt}
                  onChange={(e) => setCompareAt(e.target.value)}
                  className={cn(ui.input, "tabular-nums")}
                  placeholder="Optional"
                />
                <p className={ui.hint}>Shown struck-through when higher than the price.</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Organisation" />
            <div className="space-y-4 p-4 sm:p-5">
              <div>
                <label htmlFor="category" className={ui.label}>
                  Category
                </label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={ui.input}
                >
                  <option value="">Uncategorised</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="type" className={ui.label}>
                  Product type
                </label>
                <input
                  id="type"
                  list="product-types"
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className={ui.input}
                  placeholder="T-Shirt"
                />
                <datalist id="product-types">
                  {types.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Sticky save bar on mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex justify-end gap-3 border-t border-ink/10 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <button type="submit" className={cn(ui.btn, "w-full")} disabled={saving || uploading > 0}>
          {saving && <LoaderCircle size={14} className="animate-spin" />}
          {isNew ? "Create product" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
