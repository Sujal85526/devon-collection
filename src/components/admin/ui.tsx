import type { ReactNode } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { cn, formatDate, formatPrice, ORDER_STATUS_LABELS } from "@/lib/utils";

export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
}: {
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2 text-rose">{eyebrow}</p>}
        <h1 className="break-words font-serif text-3xl text-ink sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3 print:hidden">{actions}</div>}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("border border-ink/10 bg-white", className)}>{children}</div>;
}

export function CardHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-ink/10 px-4 py-4 sm:px-5">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink">{title}</h2>
      {action}
    </div>
  );
}

const tones = {
  neutral: "bg-ink/5 text-ink/70",
  ink: "bg-ink text-paper",
  rose: "bg-rose/15 text-[#a8075f]",
  sage: "bg-sage/25 text-[#4f6312]",
  alert: "bg-alert/15 text-[#b4532a]",
  paper: "bg-paper text-ink",
  red: "bg-red-50 text-red-700",
} as const;
export type Tone = keyof typeof tones;

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const orderTones: Record<string, Tone> = {
  pending: "alert",
  confirmed: "paper",
  processing: "paper",
  shipped: "rose",
  out_for_delivery: "rose",
  delivered: "sage",
  cancelled: "red",
  returned: "neutral",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return <Badge tone={orderTones[status] ?? "neutral"}>{ORDER_STATUS_LABELS[status] ?? status}</Badge>;
}

const paymentTones: Record<string, Tone> = { pending: "alert", paid: "sage", failed: "red", refunded: "neutral" };

export function PaymentStatusBadge({ status }: { status: string }) {
  return <Badge tone={paymentTones[status] ?? "neutral"}>{status}</Badge>;
}

export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          width={size}
          height={size}
          className={i <= rating ? "fill-alert text-alert" : "text-ink/20"}
          aria-hidden
        />
      ))}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && <div className="mb-4 flex h-12 w-12 items-center justify-center bg-paper-light text-ink/50">{icon}</div>}
      <p className="font-serif text-xl text-ink">{title}</p>
      {description && <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/**
 * Wrapper that gives tables a consistent look and horizontal scroll as a fallback.
 * List pages pass `className="hidden md:block"` and render a `MobileList` below `md`.
 */
export function TableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] text-left text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3 [&_th]:text-[10px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.18em] [&_th]:text-ink/50 [&_thead]:border-b [&_thead]:border-ink/10 [&_tbody_tr]:border-b [&_tbody_tr]:border-ink/5 [&_tbody_tr:last-child]:border-0">
        {children}
      </table>
    </div>
  );
}

/** Stacked card list shown below `md` in place of a table. Children should be `<li>` rows. */
export function MobileList({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cn("divide-y divide-ink/10 md:hidden", className)}>{children}</ul>;
}

/** Compact order row for `MobileList` (orders list + dashboard). The whole card links to the order. */
export function OrderListItem({
  order,
  withTime = false,
}: {
  order: {
    id: string;
    order_number: string;
    full_name: string;
    total: number;
    status: string;
    payment_status: string;
    payment_method?: string;
    created_at: string;
    order_items: { quantity: number }[];
  };
  withTime?: boolean;
}) {
  const units = order.order_items.reduce((s, i) => s + i.quantity, 0);
  return (
    <li className="relative space-y-1.5 px-4 py-3.5 active:bg-paper-light/60">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/admin/orders/${order.id}`} className="font-semibold text-ink after:absolute after:inset-0">
          {order.order_number}
        </Link>
        <OrderStatusBadge status={order.status} />
      </div>
      <div className="flex items-baseline justify-between gap-3 text-xs text-muted">
        <span className="min-w-0 truncate text-sm text-ink">{order.full_name}</span>
        <span className="shrink-0">{formatDate(order.created_at, withTime)}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm">
          <span className="font-medium tabular-nums text-ink">{formatPrice(order.total)}</span>
          <span className="text-xs text-muted">
            {" "}
            · {units} item{units === 1 ? "" : "s"}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {order.payment_method && (
            <span className="text-[10px] uppercase tracking-wider text-muted">{order.payment_method}</span>
          )}
          <PaymentStatusBadge status={order.payment_status} />
        </span>
      </div>
    </li>
  );
}
