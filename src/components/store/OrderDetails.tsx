import Image from "next/image";
import { Check } from "lucide-react";
import type { TrackedOrder } from "@/lib/orders";
import { cn, formatDate, formatPrice, ORDER_STATUS_LABELS } from "@/lib/utils";

const STEPS = ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered"] as const;

export function OrderDetails({ data }: { data: TrackedOrder }) {
  const { order, items, events } = data;
  const stopped = order.status === "cancelled" || order.status === "returned";
  const current = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const reachedAt = (status: string) => events.findLast((e) => e.status === status)?.created_at;
  const address = order.shipping_address;

  return (
    <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
      <div>
        <h2 className="eyebrow mb-8">Status</h2>
        {stopped ? (
          <p className="border border-alert/40 bg-alert/10 p-5 text-sm">
            This order was <strong>{ORDER_STATUS_LABELS[order.status].toLowerCase()}</strong>
            {reachedAt(order.status) ? ` on ${formatDate(reachedAt(order.status)!)}` : ""}.
          </p>
        ) : (
          <ol className="relative space-y-7 pl-10">
            <span className="absolute bottom-3 left-[11px] top-3 w-px bg-ink/15" />
            {STEPS.map((step, i) => {
              const done = i <= current;
              const at = reachedAt(step);
              return (
                <li key={step} className="relative">
                  <span
                    className={cn(
                      "absolute -left-10 grid size-6 place-items-center rounded-full border transition-colors",
                      done ? "border-ink bg-ink text-paper" : "border-ink/25 bg-paper",
                      i === current && "ring-4 ring-rose/25",
                    )}
                  >
                    {done && <Check className="size-3" strokeWidth={2.5} />}
                  </span>
                  <p className={cn("text-sm font-medium", !done && "text-ink/40")}>{ORDER_STATUS_LABELS[step]}</p>
                  {at && done && <p className="mt-0.5 text-xs text-muted">{formatDate(at, true)}</p>}
                  {step === "shipped" && done && order.tracking_number && (
                    <p className="mt-1 text-xs">
                      {order.carrier ? `${order.carrier} · ` : ""}Tracking no. <strong>{order.tracking_number}</strong>
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}

        <div className="mt-12 grid gap-8 border-t border-ink/10 pt-8 sm:grid-cols-2">
          <div>
            <h3 className="eyebrow mb-3 text-ink/60">Delivering to</h3>
            <p className="text-sm leading-relaxed">
              {order.full_name}
              <br />
              {address.line1}
              {address.line2 && <><br />{address.line2}</>}
              <br />
              {[address.city, address.emirate].filter(Boolean).join(", ")}
              {order.phone && <><br />{order.phone}</>}
            </p>
          </div>
          <div>
            <h3 className="eyebrow mb-3 text-ink/60">Payment</h3>
            <p className="text-sm">{order.payment_method === "cod" ? "Cash on delivery" : order.payment_method}</p>
            <p className="mt-1 text-xs capitalize text-muted">{order.payment_status}</p>
          </div>
        </div>
      </div>

      <aside className="h-fit rounded-2xl bg-paper p-7">
        <h2 className="eyebrow mb-6">Items</h2>
        <ul className="space-y-5">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4">
              <div className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden bg-paper">
                {item.image_url && <Image src={item.image_url} alt={item.product_name} fill sizes="64px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.04em]">{item.product_name}</p>
                <p className="mt-1 text-xs text-muted">
                  {[item.variant_label, `Qty ${item.quantity}`].filter(Boolean).join(" · ")}
                </p>
              </div>
              <p className="text-sm">{formatPrice(item.line_total)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-7 space-y-2.5 border-t border-ink/10 pt-6 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          {Number(order.discount_amount) > 0 && (
            <div className="flex justify-between text-rose">
              <dt>Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</dt>
              <dd>−{formatPrice(order.discount_amount)}</dd>
            </div>
          )}
          <div className="flex justify-between"><dt>Delivery</dt><dd>{Number(order.shipping_amount) === 0 ? "Free" : formatPrice(order.shipping_amount)}</dd></div>
          <div className="flex justify-between border-t border-ink/10 pt-3 text-base font-semibold"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
        </dl>
      </aside>
    </div>
  );
}
