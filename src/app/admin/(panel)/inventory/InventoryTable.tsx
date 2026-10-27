"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Boxes, LoaderCircle, Minus, Plus, Save, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge, Card, EmptyState, MobileList, PageHeader, TableWrap } from "@/components/admin/ui";
import { FilterBar } from "@/components/admin/FilterBar";
import { Thumb } from "@/components/admin/Thumb";
import { ui } from "@/components/admin/styles";
import { updateStock } from "./actions";

export type InventoryRow = {
  id: string;
  size: string;
  color: string | null;
  sku: string | null;
  stock: number;
  low_stock_threshold: number;
  sort_order: number;
  product: { id: string; name: string; images: string[]; is_active: boolean } | null;
};

type Filter = "all" | "low" | "out";

export function InventoryTable({
  rows,
  counts,
  filter,
  q,
  error,
}: {
  rows: InventoryRow[];
  counts: Record<Filter, number>;
  filter: Filter;
  q: string;
  error?: string;
}) {
  // Edited values keyed by variant id. Only dirty rows live here.
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [savingAll, startSaveAll] = useTransition();
  const [, startRowSave] = useTransition();

  const valueFor = (r: InventoryRow) => edits[r.id] ?? String(r.stock);
  const isDirty = (r: InventoryRow) => r.id in edits && edits[r.id] !== String(r.stock);
  const dirty = rows.filter(isDirty);

  function setValue(r: InventoryRow, value: string) {
    setEdits((prev) => {
      const next = { ...prev };
      if (value === String(r.stock)) delete next[r.id];
      else next[r.id] = value;
      return next;
    });
  }

  function bump(r: InventoryRow, delta: number) {
    const current = Number(valueFor(r)) || 0;
    setValue(r, String(Math.max(0, current + delta)));
  }

  function parse(r: InventoryRow) {
    const n = Number(edits[r.id]);
    return Number.isInteger(n) && n >= 0 ? n : null;
  }

  function clearEdits(ids: string[]) {
    setEdits((prev) => {
      const next = { ...prev };
      ids.forEach((id) => delete next[id]);
      return next;
    });
  }

  function saveRow(r: InventoryRow) {
    const stock = parse(r);
    if (stock === null) {
      toast.error("Stock must be a whole number of 0 or more");
      return;
    }
    setSavingIds((s) => new Set(s).add(r.id));
    startRowSave(async () => {
      const res = await updateStock([{ id: r.id, stock }]);
      setSavingIds((s) => {
        const n = new Set(s);
        n.delete(r.id);
        return n;
      });
      if (res.ok) {
        clearEdits([r.id]);
        toast.success(`${r.product?.name ?? "Variant"} · ${r.size} set to ${stock}`);
      } else toast.error(res.error);
    });
  }

  function saveAll() {
    const updates: { id: string; stock: number }[] = [];
    for (const r of dirty) {
      const stock = parse(r);
      if (stock === null) {
        toast.error(`Check the stock for ${r.product?.name ?? "a variant"} · ${r.size}`);
        return;
      }
      updates.push({ id: r.id, stock });
    }
    startSaveAll(async () => {
      const res = await updateStock(updates);
      if (res.ok) {
        clearEdits(updates.map((u) => u.id));
        toast.success(`Updated ${updates.length} variant${updates.length === 1 ? "" : "s"}`);
      } else toast.error(res.error);
    });
  }

  type RowState = { value: string; out: boolean; low: boolean; changed: boolean };

  // Shared by the desktop table and the mobile cards so behaviour stays identical.
  function stepper(r: InventoryRow, { value, out, low, changed }: RowState, mobile = false) {
    const stepBtn = cn(
      "flex items-center justify-center border border-ink/15 bg-white text-ink/60 hover:text-ink active:bg-paper-light",
      mobile ? "h-10 w-10" : "h-9 w-8",
    );
    return (
      <div className="flex items-center">
        <button type="button" onClick={() => bump(r, -1)} className={cn(stepBtn, "border-r-0")} aria-label="Decrease stock">
          <Minus size={mobile ? 15 : 13} />
        </button>
        <input
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(r, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && changed) saveRow(r);
          }}
          className={cn(
            "w-16 border border-ink/15 bg-white text-center tabular-nums focus:border-ink focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none",
            mobile ? "h-10 text-base" : "h-9 text-sm",
            out && "text-red-600",
            low && "text-[#b4532a]",
          )}
          aria-label={`Stock for ${r.product?.name ?? ""} ${r.size}`}
        />
        <button type="button" onClick={() => bump(r, 1)} className={cn(stepBtn, "border-l-0")} aria-label="Increase stock">
          <Plus size={mobile ? 15 : 13} />
        </button>
        <button
          type="button"
          onClick={() => bump(r, 10)}
          className={cn(
            "ml-1 px-2 text-[11px] font-semibold text-ink/50 hover:text-ink",
            mobile ? "h-10 min-w-10" : "hidden h-9 xl:block",
          )}
          aria-label="Add 10"
        >
          +10
        </button>
      </div>
    );
  }

  function rowActions(r: InventoryRow, { changed, saving }: { changed: boolean; saving: boolean }) {
    return (
      <div className="flex items-center justify-end gap-2">
        {changed && (
          <>
            <button
              type="button"
              className="px-1 text-[11px] text-ink/50 hover:text-ink max-md:min-h-10"
              onClick={() => clearEdits([r.id])}
              disabled={saving}
            >
              Reset
            </button>
            <button type="button" className={ui.btnSmall} onClick={() => saveRow(r)} disabled={saving}>
              {saving ? <LoaderCircle size={12} className="animate-spin" /> : <Save size={12} />}
              Save
            </button>
          </>
        )}
      </div>
    );
  }

  function rowState(r: InventoryRow) {
    const value = valueFor(r);
    const n = Number(value);
    const out = n === 0;
    const low = !out && n <= r.low_stock_threshold;
    return { value, out, low, changed: isDirty(r), saving: savingIds.has(r.id) };
  }

  function statusBadges(r: InventoryRow, out: boolean, low: boolean) {
    return (
      <>
        {out && (
          <Badge tone="red">
            <TriangleAlert size={10} /> Out
          </Badge>
        )}
        {low && <Badge tone="alert">Low</Badge>}
        {r.product && !r.product.is_active && <Badge>Draft</Badge>}
      </>
    );
  }

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "low", label: "Low stock" },
    { key: "out", label: "Out of stock" },
  ];
  const tabHref = (key: Filter) => {
    const p = new URLSearchParams();
    if (key !== "all") p.set("filter", key);
    if (q) p.set("q", q);
    const s = p.toString();
    return s ? `/admin/inventory?${s}` : "/admin/inventory";
  };

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Inventory"
        description="Stock per size and colour. Rows turn amber at the alert threshold and red when sold out."
        actions={
          <button type="button" className={ui.btn} onClick={saveAll} disabled={!dirty.length || savingAll}>
            {savingAll ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
            Save all{dirty.length ? ` (${dirty.length})` : ""}
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1 overflow-x-auto border-b border-ink/10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={tabHref(t.key)}
              scroll={false}
              className={cn(
                "-mb-px flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs sm:px-4 font-semibold uppercase tracking-[0.14em] transition-colors",
                filter === t.key ? "border-ink text-ink" : "border-transparent text-ink/50 hover:text-ink",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] leading-4",
                  t.key === "out" && counts.out > 0
                    ? "bg-red-100 text-red-700"
                    : t.key === "low" && counts.low > 0
                      ? "bg-alert/20 text-[#b4532a]"
                      : "bg-ink/5 text-ink/60",
                )}
              >
                {counts[t.key]}
              </span>
            </Link>
          ))}
        </div>
        <FilterBar className="lg:w-96" values={{ q, filter: filter === "all" ? "" : filter }} searchPlaceholder="Search product, SKU or colour…" />
      </div>

      {error && <p className="mb-4 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            icon={<Boxes size={20} />}
            title={filter === "all" && !q ? "No variants yet" : "Nothing here"}
            description={
              filter === "low"
                ? "No variants are running low."
                : filter === "out"
                  ? "Nothing is sold out."
                  : q
                    ? "No variants match your search."
                    : "Add products with sizes to manage stock."
            }
          />
        ) : (
          <>
          <MobileList>
            {rows.map((r) => {
              const { value, out, low, changed, saving } = rowState(r);
              return (
                <li
                  key={r.id}
                  className={cn("px-4 py-3.5", out ? "bg-red-50/60" : low ? "bg-alert/[0.07]" : "", changed && "!bg-rose/[0.07]")}
                >
                  <div className="flex gap-3">
                    <Thumb src={r.product?.images?.[0]} alt={r.product?.name ?? ""} size={48} />
                    <div className="min-w-0 flex-1">
                      {r.product ? (
                        <Link href={`/admin/products/${r.product.id}`} className="line-clamp-2 font-medium leading-snug text-ink">
                          {r.product.name}
                        </Link>
                      ) : (
                        <span className="text-muted">Unknown product</span>
                      )}
                      <p className="mt-0.5 truncate text-xs text-muted">
                        <span className="font-semibold text-ink">{r.size}</span>
                        {r.color && ` · ${r.color}`}
                        {r.sku && <span className="font-mono"> · {r.sku}</span>}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {statusBadges(r, out, low)}
                        <span className="text-[11px] text-muted">Alert at {r.low_stock_threshold}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    {stepper(r, { value, out, low, changed }, true)}
                    {rowActions(r, { changed, saving })}
                  </div>
                </li>
              );
            })}
          </MobileList>
          <TableWrap className="hidden md:block">
            <thead>
              <tr>
                <th>Product</th>
                <th>Size</th>
                <th>Colour</th>
                <th>SKU</th>
                <th className="text-right">Alert at</th>
                <th>Stock</th>
                <th className="w-px" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const { value, out, low, changed, saving } = rowState(r);
                return (
                  <tr key={r.id} className={cn(out ? "bg-red-50/60" : low ? "bg-alert/[0.07]" : "", changed && "!bg-rose/[0.07]")}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Thumb src={r.product?.images?.[0]} alt={r.product?.name ?? ""} size={40} />
                        <div className="min-w-0">
                          {r.product ? (
                            <Link href={`/admin/products/${r.product.id}`} className="block truncate font-medium text-ink hover:underline">
                              {r.product.name}
                            </Link>
                          ) : (
                            <span className="text-muted">Unknown product</span>
                          )}
                          <div className="mt-0.5 flex gap-1.5">{statusBadges(r, out, low)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="font-medium">{r.size}</td>
                    <td className="text-muted">{r.color ?? "—"}</td>
                    <td className="font-mono text-xs text-muted">{r.sku ?? "—"}</td>
                    <td className="text-right tabular-nums text-muted">{r.low_stock_threshold}</td>
                    <td>{stepper(r, { value, out, low, changed })}</td>
                    <td>{rowActions(r, { changed, saving })}</td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
          </>
        )}
      </Card>

      {/* Sticky "save all" on phones while there are unsaved edits */}
      {dirty.length > 0 && (
        <>
          <div className="h-20 md:hidden" aria-hidden />
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden">
            <button type="button" className={cn(ui.btn, "w-full")} onClick={saveAll} disabled={savingAll}>
              {savingAll ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
              Save all ({dirty.length})
            </button>
          </div>
        </>
      )}
    </>
  );
}
