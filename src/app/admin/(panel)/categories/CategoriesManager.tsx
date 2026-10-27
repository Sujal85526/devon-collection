"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, LoaderCircle, Pencil, Plus, Tags, Trash, X } from "lucide-react";
import { toast } from "sonner";
import type { Category } from "@/lib/types";
import { cn, slugify } from "@/lib/utils";
import { Badge, Card, EmptyState, MobileList, PageHeader, TableWrap } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Modal } from "@/components/admin/Modal";
import { Thumb } from "@/components/admin/Thumb";
import { Toggle } from "@/components/admin/Toggle";
import { ui } from "@/components/admin/styles";
import { uploadImage } from "@/components/admin/upload";
import { deleteCategory, saveCategory } from "./actions";

export type CategoryRow = Category & { product_count: number };

export function CategoriesManager({ categories, error }: { categories: CategoryRow[]; error?: string }) {
  const [editing, setEditing] = useState<CategoryRow | "new" | null>(null);
  const [q, setQ] = useState("");

  const visible = categories.filter((c) => {
    const term = q.trim().toLowerCase();
    return !term || c.name.toLowerCase().includes(term) || c.slug.includes(term);
  });
  const nextSort = categories.reduce((m, c) => Math.max(m, c.sort_order), 0) + 10;

  // Shared by the desktop table and the mobile cards.
  const rowActions = (c: CategoryRow) => (
    <div className="flex justify-end gap-1">
      <button type="button" className={ui.iconBtn} onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`}>
        <Pencil size={15} />
      </button>
      <ConfirmButton
        className={ui.iconBtnDanger}
        ariaLabel={`Delete ${c.name}`}
        title="Delete category?"
        message={
          <>
            <strong>{c.name}</strong> will be deleted.
            {c.product_count > 0 && (
              <>
                {" "}
                Its {c.product_count} product{c.product_count === 1 ? "" : "s"} will become{" "}
                <strong>uncategorised</strong> (they won&apos;t be deleted).
              </>
            )}
          </>
        }
        action={() => deleteCategory(c.id)}
        successMessage="Category deleted"
      >
        <Trash size={15} />
      </ConfirmButton>
    </div>
  );

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Categories"
        description="Collections shown in the shop. Featured categories appear as tiles on the homepage."
        actions={
          <button type="button" className={ui.btn} onClick={() => setEditing("new")}>
            <Plus size={14} /> New category
          </button>
        }
      />

      {error && <p className="mb-4 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {categories.length > 5 && (
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter categories…"
          className={cn(ui.input, "mb-4 sm:max-w-xs")}
          aria-label="Filter categories"
        />
      )}

      <Card>
        {visible.length === 0 ? (
          <EmptyState
            icon={<Tags size={20} />}
            title={categories.length ? "No matching categories" : "No categories yet"}
            description={categories.length ? undefined : "Group products into collections like Swim, Shirts and Caps."}
            action={
              !categories.length && (
                <button type="button" className={ui.btn} onClick={() => setEditing("new")}>
                  <Plus size={14} /> New category
                </button>
              )
            }
          />
        ) : (
          <>
          <MobileList>
            {visible.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <button type="button" onClick={() => setEditing(c)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <Thumb src={c.image_url} alt={c.name} size={48} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{c.name}</span>
                    <span className="block truncate text-xs text-muted">{c.tagline || `/${c.slug}`}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      {c.is_active ? <Badge tone="sage">Active</Badge> : <Badge>Hidden</Badge>}
                      {c.is_featured && <Badge tone="rose">Homepage</Badge>}
                      <span className="text-[11px] text-muted">
                        {c.product_count} product{c.product_count === 1 ? "" : "s"} · #{c.sort_order}
                      </span>
                    </span>
                  </span>
                </button>
                <div className="-mr-2 shrink-0">{rowActions(c)}</div>
              </li>
            ))}
          </MobileList>
          <TableWrap className="hidden md:block">
            <thead>
              <tr>
                <th>Category</th>
                <th className="text-right">Products</th>
                <th className="text-right">Order</th>
                <th>Status</th>
                <th className="w-px" />
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.id} className="hover:bg-paper-light/60">
                  <td>
                    <button type="button" onClick={() => setEditing(c)} className="flex items-center gap-3 text-left">
                      <Thumb src={c.image_url} alt={c.name} />
                      <span className="min-w-0">
                        <span className="block font-medium text-ink hover:underline">{c.name}</span>
                        <span className="block truncate text-xs text-muted">{c.tagline || `/${c.slug}`}</span>
                      </span>
                    </button>
                  </td>
                  <td className="text-right tabular-nums">{c.product_count}</td>
                  <td className="text-right tabular-nums text-muted">{c.sort_order}</td>
                  <td>
                    <div className="flex flex-wrap gap-1.5">
                      {c.is_active ? <Badge tone="sage">Active</Badge> : <Badge>Hidden</Badge>}
                      {c.is_featured && <Badge tone="rose">Homepage</Badge>}
                    </div>
                  </td>
                  <td>
                    {rowActions(c)}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          </>
        )}
      </Card>

      {editing && (
        <CategoryForm
          key={editing === "new" ? "new" : editing.id}
          category={editing === "new" ? undefined : editing}
          defaultSort={nextSort}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function CategoryForm({
  category,
  defaultSort,
  onClose,
}: {
  category?: CategoryRow;
  defaultSort: number;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const [tagline, setTagline] = useState(category?.tagline ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(category?.image_url ?? null);
  const [sortOrder, setSortOrder] = useState(String(category?.sort_order ?? defaultSort));
  const [isFeatured, setIsFeatured] = useState(category?.is_featured ?? false);
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    setUploading(true);
    try {
      setImageUrl(await uploadImage(file, "categories"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const sort = Number(sortOrder);
    startTransition(async () => {
      const res = await saveCategory({
        id: category?.id,
        name,
        slug: slug || slugify(name),
        tagline,
        description,
        image_url: imageUrl,
        sort_order: Number.isInteger(sort) ? sort : 0,
        is_featured: isFeatured,
        is_active: isActive,
      });
      if (res.ok) {
        toast.success(category ? "Category saved" : "Category created");
        onClose();
      } else toast.error(res.error);
    });
  }

  return (
    <Modal
      open
      onClose={() => !pending && onClose()}
      title={category ? `Edit ${category.name}` : "New category"}
      size="lg"
      footer={
        <>
          <button type="button" className={ui.btnGhost} onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button type="submit" form="category-form" className={ui.btn} disabled={pending || uploading}>
            {pending && <LoaderCircle size={14} className="animate-spin" />}
            {category ? "Save" : "Create"}
          </button>
        </>
      }
    >
      <form id="category-form" onSubmit={submit} className="grid gap-5 sm:grid-cols-[1fr_200px]">
        <div className="space-y-4">
          <div>
            <label htmlFor="c-name" className={ui.label}>
              Name
            </label>
            <input
              id="c-name"
              required
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              className={ui.input}
              placeholder="Swimwear"
            />
          </div>
          <div>
            <label htmlFor="c-slug" className={ui.label}>
              Slug
            </label>
            <input
              id="c-slug"
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
          <div>
            <label htmlFor="c-tagline" className={ui.label}>
              Tagline
            </label>
            <input
              id="c-tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className={ui.input}
              placeholder="Made for open water"
            />
          </div>
          <div>
            <label htmlFor="c-desc" className={ui.label}>
              Description
            </label>
            <textarea
              id="c-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={ui.input}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-[120px_1fr] sm:items-start">
            <div>
              <label htmlFor="c-sort" className={ui.label}>
                Sort order
              </label>
              <input
                id="c-sort"
                type="number"
                step={1}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className={cn(ui.input, "tabular-nums")}
              />
            </div>
            <div className="space-y-3 pt-1 sm:pt-5">
              <Toggle checked={isActive} onChange={setIsActive} label="Active" description="Visible in the shop" />
              <Toggle
                checked={isFeatured}
                onChange={setIsFeatured}
                label="Homepage tile"
                description="Show as a featured collection on the homepage"
              />
            </div>
          </div>
        </div>

        <div className="max-sm:w-40">
          <span className={ui.label}>Image</span>
          <div className="relative aspect-[4/5] overflow-hidden border border-ink/10 bg-paper-light">
            {imageUrl ? (
              <>
                <Image src={imageUrl} alt="" fill sizes="200px" className="object-cover" unoptimized />
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center bg-white/90 text-ink/70 hover:text-red-600 sm:h-7 sm:w-7"
                  aria-label="Remove image"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink/50 hover:text-ink"
              >
                {uploading ? <LoaderCircle size={20} className="animate-spin" /> : <ImagePlus size={22} strokeWidth={1.5} />}
                <span className="text-[11px] font-medium">{uploading ? "Uploading…" : "Upload image"}</span>
              </button>
            )}
          </div>
          {imageUrl && (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="mt-2 text-xs text-rose hover:underline max-sm:min-h-10"
              disabled={uploading}
            >
              {uploading ? "Uploading…" : "Replace image"}
            </button>
          )}
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
              e.target.value = "";
            }}
          />
        </div>
      </form>
    </Modal>
  );
}
