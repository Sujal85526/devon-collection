import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/types";
import { cn, formatDate, formatPrice, ORDER_STATUS_LABELS } from "@/lib/utils";
import {
  Card,
  EmptyState,
  MobileList,
  OrderListItem,
  OrderStatusBadge,
  PageHeader,
  PaymentStatusBadge,
  TableWrap,
} from "@/components/admin/ui";
import { FilterBar } from "@/components/admin/FilterBar";
import { ui } from "@/components/admin/styles";
import { searchTerm } from "../../_lib/dates";

export const metadata: Metadata = { title: "Orders" };

const PAGE_SIZE = 25;

type Row = {
  id: string;
  order_number: string;
  full_name: string;
  email: string;
  total: number;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  order_items: { quantity: number }[];
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; payment?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const status = (ORDER_STATUSES as readonly string[]).includes(sp.status ?? "") || sp.status === "open" ? sp.status! : "";
  const payment = (PAYMENT_STATUSES as readonly string[]).includes(sp.payment ?? "") ? sp.payment! : "";
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const { supabase } = await requireAdmin();

  let query = supabase
    .from("orders")
    .select(
      "id, order_number, full_name, email, total, status, payment_status, payment_method, created_at, order_items(quantity)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (status === "open") query = query.in("status", ["pending", "confirmed", "processing"]);
  else if (status) query = query.eq("status", status);
  if (payment) query = query.eq("payment_status", payment);
  const term = searchTerm(q);
  if (term) query = query.or(`order_number.ilike.%${term}%,email.ilike.%${term}%,full_name.ilike.%${term}%`);

  const { data, count, error } = await query;
  const orders = (data ?? []) as unknown as Row[];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = Boolean(term || status || payment);

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (payment) params.set("payment", payment);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return s ? `/admin/orders?${s}` : "/admin/orders";
  };

  return (
    <>
      <PageHeader eyebrow="Sales" title="Orders" description={`${total} order${total === 1 ? "" : "s"}${filtered ? " match your filters" : ""}`} />

      <FilterBar
        className="mb-4"
        values={{ q, status, payment }}
        searchPlaceholder="Search order number, email or name…"
        selects={[
          {
            name: "status",
            label: "Any status",
            options: [
              { value: "open", label: "To process (open)" },
              ...ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABELS[s] ?? s })),
            ],
          },
          {
            name: "payment",
            label: "Any payment",
            options: PAYMENT_STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })),
          },
        ]}
      />

      {error && <p className="mb-4 bg-red-50 px-4 py-3 text-sm text-red-700">{error.message}</p>}

      <Card>
        {orders.length === 0 ? (
          <EmptyState
            icon={<Inbox size={20} />}
            title={filtered ? "No matching orders" : "No orders yet"}
            description={filtered ? "Try a different search or clear the filters." : "Orders placed in the shop will appear here."}
          />
        ) : (
          <>
          <MobileList>
            {orders.map((o) => (
              <OrderListItem key={o.id} order={o} withTime />
            ))}
          </MobileList>
          <TableWrap className="hidden md:block">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Customer</th>
                <th className="text-right">Items</th>
                <th className="text-right">Total</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="relative hover:bg-paper-light/60">
                  <td>
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold text-ink after:absolute after:inset-0 hover:underline">
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap text-muted">{formatDate(o.created_at, true)}</td>
                  <td>
                    <p className="text-ink">{o.full_name}</p>
                    <p className="text-xs text-muted">{o.email}</p>
                  </td>
                  <td className="text-right tabular-nums">{o.order_items.reduce((s, i) => s + i.quantity, 0)}</td>
                  <td className="whitespace-nowrap text-right font-medium tabular-nums">{formatPrice(o.total)}</td>
                  <td>
                    <PaymentStatusBadge status={o.payment_status} />
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted">{o.payment_method}</p>
                  </td>
                  <td>
                    <OrderStatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          </>
        )}
      </Card>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3 text-sm text-muted">
          <span>
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            <Link
              href={pageHref(page - 1)}
              aria-disabled={page <= 1}
              className={cn(ui.btnSmall, page <= 1 && "pointer-events-none opacity-40")}
            >
              <ChevronLeft size={13} /> Previous
            </Link>
            <Link
              href={pageHref(page + 1)}
              aria-disabled={page >= pages}
              className={cn(ui.btnSmall, page >= pages && "pointer-events-none opacity-40")}
            >
              Next <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
