"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, Pencil, Plus, TicketPercent, Trash, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import type { Coupon } from "@/lib/types";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { Badge, Card, EmptyState, MobileList, PageHeader, TableWrap, type Tone } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Modal } from "@/components/admin/Modal";
import { Toggle } from "@/components/admin/Toggle";
import { ui } from "@/components/admin/styles";
import { fromDateTimeLocal, toDateTimeLocal } from "../../_lib/dates";
import { deleteCoupon, saveCoupon, setCouponActive } from "./actions";

type Filter = "all" | "live" | "scheduled" | "expired" | "inactive";

function couponState(c: Coupon, now: number): { label: string; tone: Tone; key: Exclude<Filter, "all"> } {
  if (!c.is_active) return { label: "Inactive", tone: "neutral", key: "inactive" };
  if (c.expires_at && Date.parse(c.expires_at) < now) return { label: "Expired", tone: "red", key: "expired" };
  if (c.usage_limit != null && c.used_count >= c.usage_limit) return { label: "Used up", tone: "red", key: "expired" };
  if (c.starts_at && Date.parse(c.starts_at) > now) return { label: "Scheduled", tone: "paper", key: "scheduled" };
  return { label: "Live", tone: "sage", key: "live" };
}

function describeValue(c: Pick<Coupon, "discount_type" | "value" | "max_discount">) {
  return c.discount_type === "percent"
    ? `${Number(c.value)}% off${c.max_discount ? ` (max ${formatPrice(c.max_discount)})` : ""}`
    : `${formatPrice(c.value)} off`;
}

export function CouponsManager({ coupons, error }: { coupons: Coupon[]; error?: string }) {
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  // Snapshot "now" once per mount so rendering stays pure.
  const [now] = useState(() => Date.now());

  const rows = coupons
    .map((c) => ({ coupon: c, state: couponState(c, now) }))
    .filter(({ coupon, state }) => {
      if (filter !== "all" && state.key !== filter) return false;
      const term = q.trim().toLowerCase();
      return !term || coupon.code.toLowerCase().includes(term) || (coupon.description ?? "").toLowerCase().includes(term);
    });

  // Shared by the desktop table and the mobile cards.
  const rowActions = (c: Coupon) => (
    <div className="flex items-center justify-end gap-1">
      <ActiveSwitch coupon={c} />
      <button type="button" className={ui.iconBtn} onClick={() => setEditing(c)} aria-label={`Edit ${c.code}`}>
        <Pencil size={15} />
      </button>
      <ConfirmButton
        className={ui.iconBtnDanger}
        ariaLabel={`Delete ${c.code}`}
        title="Delete coupon?"
        message={
          <>
            <strong className="font-mono">{c.code}</strong> will stop working immediately. Past orders keep
            their discount.
          </>
        }
        action={() => deleteCoupon(c.id)}
        successMessage="Coupon deleted"
      >
        <Trash size={15} />
      </ConfirmButton>
    </div>
  );

  return (
    <>
      <PageHeader
        eyebrow="Sales"
        title="Coupons"
        description="Discount codes customers can enter at checkout."
        actions={
          <button type="button" className={ui.btn} onClick={() => setEditing("new")}>
            <Plus size={14} /> New coupon
          </button>
        }
      />

      {error && <p className="mb-4 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {coupons.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search code or description…"
            className={cn(ui.input, "flex-1")}
            aria-label="Search coupons"
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} className={cn(ui.input, "sm:w-48")} aria-label="Status">
            <option value="all">Any status</option>
            <option value="live">Live</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired / used up</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      )}

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            icon={<TicketPercent size={20} />}
            title={coupons.length ? "No matching coupons" : "No coupons yet"}
            description={coupons.length ? undefined : "Create a code like SUMMER15 for a seasonal promotion."}
            action={
              !coupons.length && (
                <button type="button" className={ui.btn} onClick={() => setEditing("new")}>
                  <Plus size={14} /> New coupon
                </button>
              )
            }
          />
        ) : (
          <>
          <MobileList>
            {rows.map(({ coupon: c, state }) => (
              <li key={c.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-2">
                  <button type="button" onClick={() => setEditing(c)} className="min-w-0 py-2 text-left">
                    <span className="block truncate font-mono text-sm font-semibold tracking-wider text-ink">{c.code}</span>
                  </button>
                  <div className="-mr-2 shrink-0">{rowActions(c)}</div>
                </div>
                {c.description && <p className="-mt-1 truncate text-xs text-muted">{c.description}</p>}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <Badge tone={state.tone}>{state.label}</Badge>
                  <span className="text-ink">{describeValue(c)}</span>
                  {Number(c.min_order_amount) > 0 && (
                    <span className="text-xs text-muted">over {formatPrice(c.min_order_amount)}</span>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted">
                  <span className="flex items-center gap-2 tabular-nums">
                    <span>
                      <span className="font-medium text-ink">{c.used_count}</span> / {c.usage_limit ?? "∞"} used
                    </span>
                    {c.usage_limit != null && (
                      <span className="block h-1 w-12 bg-ink/10">
                        <span
                          className="block h-full bg-rose"
                          style={{ width: `${Math.min(100, (c.used_count / c.usage_limit) * 100)}%` }}
                        />
                      </span>
                    )}
                  </span>
                  <span className="truncate text-right">
                    {c.starts_at || c.expires_at ? (
                      <>
                        {c.starts_at ? formatDate(c.starts_at) : "Now"} → {c.expires_at ? formatDate(c.expires_at) : "No end"}
                      </>
                    ) : (
                      "Always valid"
                    )}
                  </span>
                </div>
              </li>
            ))}
          </MobileList>
          <TableWrap className="hidden md:block">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th className="text-right">Min. order</th>
                <th>Usage</th>
                <th>Valid</th>
                <th>Status</th>
                <th className="w-px" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ coupon: c, state }) => (
                <tr key={c.id} className="hover:bg-paper-light/60">
                  <td>
                    <button type="button" onClick={() => setEditing(c)} className="text-left">
                      <span className="font-mono text-sm font-semibold tracking-wider text-ink hover:underline">{c.code}</span>
                      {c.description && <span className="block max-w-[220px] truncate text-xs text-muted">{c.description}</span>}
                    </button>
                  </td>
                  <td className="whitespace-nowrap">{describeValue(c)}</td>
                  <td className="whitespace-nowrap text-right tabular-nums text-muted">
                    {Number(c.min_order_amount) > 0 ? formatPrice(c.min_order_amount) : "—"}
                  </td>
                  <td className="whitespace-nowrap tabular-nums">
                    {c.used_count}
                    <span className="text-muted"> / {c.usage_limit ?? "∞"}</span>
                    {c.usage_limit != null && (
                      <span className="mt-1 block h-1 w-16 bg-ink/10">
                        <span
                          className="block h-full bg-rose"
                          style={{ width: `${Math.min(100, (c.used_count / c.usage_limit) * 100)}%` }}
                        />
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-xs text-muted">
                    {c.starts_at || c.expires_at ? (
                      <>
                        {c.starts_at ? formatDate(c.starts_at) : "Now"} → {c.expires_at ? formatDate(c.expires_at) : "No end"}
                      </>
                    ) : (
                      "Always"
                    )}
                  </td>
                  <td>
                    <Badge tone={state.tone}>{state.label}</Badge>
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
        <CouponForm key={editing === "new" ? "new" : editing.id} coupon={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}

function ActiveSwitch({ coupon }: { coupon: Coupon }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={coupon.is_active}
      aria-label={coupon.is_active ? "Deactivate" : "Activate"}
      title={coupon.is_active ? "Deactivate" : "Activate"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await setCouponActive(coupon.id, !coupon.is_active);
          if (!res.ok) toast.error(res.error);
        })
      }
      className="mr-1 inline-flex items-center justify-center disabled:opacity-50 max-md:h-10 max-md:w-11"
    >
      <span
        className={cn(
          "relative inline-flex h-4 w-7 items-center rounded-full transition-colors",
          coupon.is_active ? "bg-rose" : "bg-ink/20",
        )}
      >
        <span
          className={cn(
            "inline-block h-3 w-3 rounded-full bg-white shadow transition-transform",
            coupon.is_active ? "translate-x-3.5" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `RIVA-${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")}`;
}

function CouponForm({ coupon, onClose }: { coupon?: Coupon; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState(coupon?.code ?? "");
  const [description, setDescription] = useState(coupon?.description ?? "");
  const [type, setType] = useState<"percent" | "fixed">(coupon?.discount_type ?? "percent");
  const [value, setValue] = useState(coupon ? String(coupon.value) : "");
  const [minOrder, setMinOrder] = useState(coupon ? String(coupon.min_order_amount) : "0");
  const [maxDiscount, setMaxDiscount] = useState(coupon?.max_discount != null ? String(coupon.max_discount) : "");
  const [usageLimit, setUsageLimit] = useState(coupon?.usage_limit != null ? String(coupon.usage_limit) : "");
  const [startsAt, setStartsAt] = useState(toDateTimeLocal(coupon?.starts_at));
  const [expiresAt, setExpiresAt] = useState(toDateTimeLocal(coupon?.expires_at));
  const [isActive, setIsActive] = useState(coupon?.is_active ?? true);

  const num = (v: string) => (v.trim() === "" ? null : Number(v));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const valueNum = Number(value);
    if (!value || Number.isNaN(valueNum)) {
      toast.error("Enter a discount value");
      return;
    }
    startTransition(async () => {
      const res = await saveCoupon({
        id: coupon?.id,
        code,
        description,
        discount_type: type,
        value: valueNum,
        min_order_amount: num(minOrder) ?? 0,
        max_discount: type === "percent" ? num(maxDiscount) : null,
        usage_limit: num(usageLimit),
        starts_at: fromDateTimeLocal(startsAt),
        expires_at: fromDateTimeLocal(expiresAt),
        is_active: isActive,
      });
      if (res.ok) {
        toast.success(coupon ? "Coupon saved" : "Coupon created");
        onClose();
      } else toast.error(res.error);
    });
  }

  const preview =
    value && !Number.isNaN(Number(value))
      ? describeValue({ discount_type: type, value: Number(value), max_discount: num(maxDiscount) })
      : null;

  return (
    <Modal
      open
      onClose={() => !pending && onClose()}
      title={coupon ? `Edit ${coupon.code}` : "New coupon"}
      size="lg"
      footer={
        <>
          <button type="button" className={ui.btnGhost} onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button type="submit" form="coupon-form" className={ui.btn} disabled={pending}>
            {pending && <LoaderCircle size={14} className="animate-spin" />}
            {coupon ? "Save" : "Create"}
          </button>
        </>
      }
    >
      <form id="coupon-form" onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cp-code" className={ui.label}>
              Code
            </label>
            <div className="flex">
              <input
                id="cp-code"
                required
                autoFocus={!coupon}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
                className={cn(ui.input, "min-w-0 font-mono tracking-wider")}
                placeholder="SUMMER15"
              />
              <button
                type="button"
                onClick={() => setCode(generateCode())}
                className="flex shrink-0 items-center gap-1.5 border border-l-0 border-ink/15 bg-paper-light px-3 text-[11px] font-semibold text-ink hover:bg-paper"
                title="Generate a random code"
              >
                <WandSparkles size={13} /> Generate
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="cp-desc" className={ui.label}>
              Description
            </label>
            <input
              id="cp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={ui.input}
              placeholder="Summer sale — 15% off"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-1">
            <span className={ui.label}>Type</span>
            <div className="grid grid-cols-2 border border-ink/15">
              {(["percent", "fixed"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    "py-2.5 text-xs font-semibold transition-colors sm:py-2",
                    type === t ? "bg-ink text-paper" : "bg-white text-ink/60 hover:text-ink",
                  )}
                  aria-pressed={type === t}
                >
                  {t === "percent" ? "Percent %" : "Fixed AED"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="cp-value" className={ui.label}>
              Value {type === "percent" ? "(%)" : "(AED)"}
            </label>
            <input
              id="cp-value"
              type="number"
              required
              min={0.01}
              max={type === "percent" ? 100 : undefined}
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={cn(ui.input, "tabular-nums")}
            />
          </div>
          {type === "percent" && (
            <div>
              <label htmlFor="cp-max" className={ui.label}>
                Max discount (AED)
              </label>
              <input
                id="cp-max"
                type="number"
                min={0}
                step="0.01"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                className={cn(ui.input, "tabular-nums")}
                placeholder="No cap"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="cp-min" className={ui.label}>
              Minimum order (AED)
            </label>
            <input
              id="cp-min"
              type="number"
              min={0}
              step="0.01"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              className={cn(ui.input, "tabular-nums")}
            />
          </div>
          <div>
            <label htmlFor="cp-limit" className={ui.label}>
              Usage limit
            </label>
            <input
              id="cp-limit"
              type="number"
              min={1}
              step={1}
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              className={cn(ui.input, "tabular-nums")}
              placeholder="Unlimited"
            />
            {coupon && <p className={ui.hint}>Used {coupon.used_count} time{coupon.used_count === 1 ? "" : "s"} so far.</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cp-start" className={ui.label}>
              Starts
            </label>
            <input
              id="cp-start"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className={ui.input}
            />
            <p className={ui.hint}>Leave empty to start immediately.</p>
          </div>
          <div>
            <label htmlFor="cp-end" className={ui.label}>
              Expires
            </label>
            <input
              id="cp-end"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className={ui.input}
            />
            <p className={ui.hint}>Leave empty for no expiry.</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-ink/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <Toggle checked={isActive} onChange={setIsActive} label="Active" description="Inactive codes are rejected at checkout" />
          {preview && (
            <p className="text-sm text-muted">
              <span className="font-mono font-semibold text-ink">{code || "CODE"}</span> · {preview}
              {num(minOrder) ? ` on orders over ${formatPrice(num(minOrder))}` : ""}
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}
