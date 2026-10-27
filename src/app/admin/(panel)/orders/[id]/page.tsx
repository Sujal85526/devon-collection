import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone, User } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import type { Order, OrderEvent, OrderItem } from "@/lib/types";
import { cn, formatDate, formatPrice, ORDER_STATUS_LABELS } from "@/lib/utils";
import { Card, CardHeader, OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/ui";
import { Thumb } from "@/components/admin/Thumb";
import { OrderControls, PrintButton } from "./OrderControls";

export const metadata: Metadata = { title: "Order" };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireAdmin();

  const { data: orderData } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (!orderData) notFound();
  const order = orderData as Order;

  const [{ data: itemsData }, { data: eventsData }, { count: customerOrders }] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", id).order("product_name"),
    supabase.from("order_events").select("id, order_id, status, note, created_at").eq("order_id", id).order("created_at"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("email", order.email),
  ]);
  const items = (itemsData ?? []) as OrderItem[];
  const events = (eventsData ?? []) as OrderEvent[];
  const units = items.reduce((s, i) => s + i.quantity, 0);
  const addr = order.shipping_address ?? {};

  return (
    <div className="pb-12">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/admin/orders"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-ink/60 hover:text-ink print:hidden"
          >
            <ArrowLeft size={14} /> Orders
          </Link>
          {/* Print-only brand header for the packing slip */}
          <div className="mb-6 hidden items-center justify-between border-b border-ink/20 pb-4 print:flex">
            <Image src="/brand/logo-black.png" alt="Devon Collection" width={960} height={220} className="h-10 w-auto" />
            <p className="text-right text-xs uppercase tracking-[0.25em] text-ink">Packing slip</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="break-all font-serif text-3xl text-ink sm:text-4xl">{order.order_number}</h1>
            <span className="print:hidden">
              <OrderStatusBadge status={order.status} />
            </span>
            <span className="print:hidden">
              <PaymentStatusBadge status={order.payment_status} />
            </span>
          </div>
          <p className="mt-2 text-sm text-muted">Placed {formatDate(order.created_at, true)}</p>
        </div>
        <div className="print:hidden">
          <PrintButton />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 print:block">
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <Card className="print:border-0">
            <CardHeader title={`Items · ${units}`} />
            <ul className="divide-y divide-ink/5">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-5">
                  <Thumb src={item.image_url} alt={item.product_name} size={56} className="print:hidden" />
                  <div className="min-w-0 flex-1 break-words">
                    {item.product_id ? (
                      <Link href={`/admin/products/${item.product_id}`} className="font-medium text-ink hover:underline">
                        {item.product_name}
                      </Link>
                    ) : (
                      <span className="font-medium text-ink">{item.product_name}</span>
                    )}
                    {item.variant_label && <p className="text-xs text-muted">{item.variant_label}</p>}
                    <p className="text-xs text-muted print:hidden">
                      {formatPrice(item.unit_price)} × {item.quantity}
                    </p>
                  </div>
                  <span className="hidden text-sm font-semibold print:inline">Qty {item.quantity}</span>
                  <span className="shrink-0 font-medium tabular-nums print:hidden">{formatPrice(item.line_total)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-ink/10 px-4 py-4 text-sm sm:px-5 print:hidden">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">
                    Discount
                    {order.coupon_code && (
                      <span className="ml-2 bg-rose/15 px-1.5 py-0.5 font-mono text-[11px] text-[#a8075f]">
                        {order.coupon_code}
                      </span>
                    )}
                  </dt>
                  <dd className="tabular-nums text-[#a8075f]">−{formatPrice(order.discount_amount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd className="tabular-nums">{Number(order.shipping_amount) === 0 ? "Free" : formatPrice(order.shipping_amount)}</dd>
              </div>
              <div className="flex justify-between border-t border-ink/10 pt-2 text-base font-semibold text-ink">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatPrice(order.total)}</dd>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <dt>Payment method</dt>
                <dd className="uppercase">
                  {order.payment_method}
                  {order.payment_provider ? ` · ${order.payment_provider}` : ""}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Timeline */}
          <Card className="print:hidden">
            <CardHeader title="Timeline" />
            {events.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted sm:px-5">No events recorded.</p>
            ) : (
              <ol className="px-4 py-5 sm:px-5">
                {events.map((e, i) => {
                  const last = i === events.length - 1;
                  return (
                    <li key={e.id} className="relative flex gap-4 pb-6 last:pb-0">
                      {!last && <span className="absolute left-[5px] top-4 h-full w-px bg-ink/10" />}
                      <span
                        className={cn(
                          "relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2",
                          last ? "border-rose bg-rose" : "border-ink/30 bg-white",
                          (e.status === "cancelled" || e.status === "returned") && "border-red-400 bg-red-400",
                        )}
                      />
                      <div>
                        <p className="text-sm font-medium text-ink">{ORDER_STATUS_LABELS[e.status] ?? e.status}</p>
                        {e.note && <p className="text-sm text-ink/70">{e.note}</p>}
                        <p className="text-xs text-muted">{formatDate(e.created_at, true)}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-6 print:mt-6 print:grid print:grid-cols-2 print:gap-6 print:space-y-0">
          {/* Customer */}
          <Card className="print:border-0">
            <CardHeader title="Customer" />
            <div className="space-y-2.5 px-4 py-4 text-sm sm:px-5">
              <p className="flex items-center gap-2 font-medium text-ink">
                <User size={14} className="text-ink/40 print:hidden" /> {order.full_name}
              </p>
              <p className="flex items-center gap-2">
                <Mail size={14} className="text-ink/40 print:hidden" />
                <a href={`mailto:${order.email}`} className="break-all text-rose hover:underline print:text-ink">
                  {order.email}
                </a>
              </p>
              {order.phone && (
                <p className="flex items-center gap-2">
                  <Phone size={14} className="text-ink/40 print:hidden" />
                  <a href={`tel:${order.phone}`} className="hover:underline">
                    {order.phone}
                  </a>
                </p>
              )}
              <p className="pt-1 text-xs text-muted print:hidden">
                {order.user_id ? "Registered customer" : "Guest checkout"} ·{" "}
                <Link href={`/admin/orders?q=${encodeURIComponent(order.email)}`} className="text-rose hover:underline">
                  {customerOrders ?? 1} order{customerOrders === 1 ? "" : "s"}
                </Link>
              </p>
            </div>
          </Card>

          {/* Shipping */}
          <Card className="print:border-0">
            <CardHeader title="Ship to" />
            <div className="flex gap-2 px-4 py-4 text-sm leading-relaxed sm:px-5">
              <MapPin size={14} className="mt-1 shrink-0 text-ink/40 print:hidden" />
              <address className="not-italic">
                <span className="font-medium text-ink">{order.full_name}</span>
                {addr.line1 && <span className="block">{addr.line1}</span>}
                {addr.line2 && <span className="block">{addr.line2}</span>}
                {(addr.city || addr.emirate) && <span className="block">{[addr.city, addr.emirate].filter(Boolean).join(", ")}</span>}
                {addr.country && <span className="block">{addr.country}</span>}
                {order.phone && <span className="block">{order.phone}</span>}
                {addr.notes && (
                  <span className="mt-2 block border-l-2 border-alert/60 pl-2 text-xs text-ink/70">Note: {addr.notes}</span>
                )}
              </address>
            </div>
            {(order.carrier || order.tracking_number) && (
              <p className="border-t border-ink/10 px-4 py-3 text-xs text-muted sm:px-5">
                {order.carrier && <span className="font-medium text-ink">{order.carrier}</span>}
                {order.tracking_number && <span className="ml-2 font-mono">{order.tracking_number}</span>}
              </p>
            )}
          </Card>

          <div className="print:hidden">
            <OrderControls
              key={order.updated_at}
              order={{
                id: order.id,
                status: order.status,
                payment_status: order.payment_status,
                carrier: order.carrier,
                tracking_number: order.tracking_number,
                notes: order.notes,
              }}
            />
          </div>
        </div>
      </div>

      <p className="mt-10 hidden text-center font-serif text-lg italic text-ink print:block">
        Thank you for shopping Devon Collection — luxury in each detail.
      </p>
    </div>
  );
}
