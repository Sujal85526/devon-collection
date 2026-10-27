import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CircleCheck,
  Clock,
  ExternalLink,
  Inbox,
  Plus,
  Receipt,
  ShoppingBag,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import {
  Card,
  EmptyState,
  MobileList,
  OrderListItem,
  OrderStatusBadge,
  PaymentStatusBadge,
  TableWrap,
} from "@/components/admin/ui";
import { Thumb } from "@/components/admin/Thumb";
import { ui } from "@/components/admin/styles";
import { RevenueChart, type DayRevenue } from "./RevenueChart";

export const metadata: Metadata = { title: "Dashboard" };

const TZ = "Asia/Dubai";
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const dayLabel = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short" });
const weekday = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short" });
const longDate = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });
const hourInDubai = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "numeric", hour12: false });

type RecentOrder = {
  id: string;
  order_number: string;
  full_name: string;
  email: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  order_items: { quantity: number }[];
};

type StockRow = {
  id: string;
  size: string;
  color: string | null;
  stock: number;
  low_stock_threshold: number;
  product: { id: string; name: string; images: string[] } | null;
};

type SoldItem = { product_id: string | null; product_name: string; image_url: string | null; quantity: number; line_total: number };

const isCounted = (status: string) => status !== "cancelled" && status !== "returned";

async function loadDashboard() {
  const { supabase, profile } = await requireAdmin();
  const now = Date.now();
  const since30 = new Date(now - 30 * 864e5).toISOString();
  const since60 = new Date(now - 60 * 864e5).toISOString();

  const [ordersRes, toProcessRes, variantsRes, reviewsRes, recentRes, soldRes] = await Promise.all([
    supabase.from("orders").select("total, status, email, created_at").gte("created_at", since60),
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["pending", "confirmed", "processing"]),
    supabase.from("product_variants").select("id, size, color, stock, low_stock_threshold, product:products(id, name, images)"),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("orders")
      .select("id, order_number, full_name, email, total, status, payment_status, created_at, order_items(quantity)")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("order_items")
      .select("product_id, product_name, image_url, quantity, line_total, order:orders!inner(created_at, status)")
      .gte("order.created_at", since30)
      .not("order.status", "in", "(cancelled,returned)"),
  ]);

  const all = (ordersRes.data ?? []) as { total: number; status: string; email: string; created_at: string }[];
  const current = all.filter((o) => o.created_at >= since30 && isCounted(o.status));
  const previous = all.filter((o) => o.created_at < since30 && isCounted(o.status));
  const sum = (rows: typeof all) => rows.reduce((s, o) => s + Number(o.total), 0);

  const revenue = sum(current);
  const prevRevenue = sum(previous);
  const aov = current.length ? revenue / current.length : 0;
  const prevAov = previous.length ? prevRevenue / previous.length : 0;
  const customers = new Set(current.map((o) => o.email.toLowerCase())).size;
  const prevCustomers = new Set(previous.map((o) => o.email.toLowerCase())).size;

  const days: DayRevenue[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 864e5);
    days.push({ key: dayKey.format(d), label: dayLabel.format(d), weekday: weekday.format(d), revenue: 0, orders: 0 });
  }
  const byKey = new Map(days.map((d) => [d.key, d]));
  for (const o of current) {
    const bucket = byKey.get(dayKey.format(new Date(o.created_at)));
    if (bucket) {
      bucket.revenue += Number(o.total);
      bucket.orders += 1;
    }
  }

  const variants = (variantsRes.data ?? []) as unknown as StockRow[];
  const lowStock = variants.filter((v) => v.stock <= v.low_stock_threshold).sort((a, b) => a.stock - b.stock);

  // Best sellers over the last 30 days, by units.
  const sold = new Map<string, { name: string; image: string | null; units: number; revenue: number; id: string | null }>();
  for (const item of (soldRes.data ?? []) as unknown as SoldItem[]) {
    const key = item.product_id ?? item.product_name;
    const row = sold.get(key) ?? { name: item.product_name, image: item.image_url, units: 0, revenue: 0, id: item.product_id };
    row.units += item.quantity;
    row.revenue += Number(item.line_total);
    sold.set(key, row);
  }
  const topProducts = [...sold.values()].sort((a, b) => b.units - a.units).slice(0, 5);

  return {
    firstName: profile?.full_name?.split(" ")[0] ?? "",
    kpis: { revenue, prevRevenue, orders: current.length, prevOrders: previous.length, aov, prevAov, customers, prevCustomers },
    toProcess: toProcessRes.count ?? 0,
    lowStock,
    pendingReviews: reviewsRes.count ?? 0,
    recent: (recentRes.data ?? []) as unknown as RecentOrder[],
    topProducts,
    days,
    error: ordersRes.error?.message ?? variantsRes.error?.message ?? recentRes.error?.message ?? null,
  };
}

function greeting() {
  const h = Number(hourInDubai.format(new Date()));
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/** Change vs the previous 30 days, as a small pill. Hidden when there is nothing to compare. */
function Delta({ now, before }: { now: number; before: number }) {
  if (before === 0 && now === 0) return <span className="text-xs text-muted">No sales yet</span>;
  if (before === 0) return <span className="text-xs text-muted">New this period</span>;
  const pct = ((now - before) / before) * 100;
  const up = pct >= 0;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
          up ? "bg-rose/12 text-[#a8075f]" : "bg-alert/15 text-[#b4532a]",
        )}
      >
        {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {Math.abs(pct).toFixed(0)}%
      </span>
      <span className="hidden sm:inline">vs previous 30 days</span>
    </span>
  );
}

function Kpi({ label, value, icon, children }: { label: string; value: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col justify-between gap-4 p-4 sm:gap-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/55 sm:text-[11px]">{label}</p>
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-paper-light text-ink/70 sm:size-9">{icon}</span>
      </div>
      <div>
        <p className="font-sans text-[22px] font-semibold leading-none tracking-tight text-ink tabular-nums lining-nums sm:text-[30px]">
          {value}
        </p>
        <div className="mt-3">{children}</div>
      </div>
    </Card>
  );
}

function Attention({ href, icon, count, label, done }: { href: string; icon: React.ReactNode; count: number; label: string; done: string }) {
  const clear = count === 0;
  return (
    <Link href={href} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-paper-light/70 sm:px-6">
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-full",
          clear ? "bg-rose/12 text-[#a8075f]" : "bg-alert/15 text-[#b4532a]",
        )}
      >
        {clear ? <CircleCheck size={18} /> : icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">
          {clear ? done : <><span className="tabular-nums">{count}</span> {label}</>}
        </p>
        <p className="text-xs text-muted">{clear ? "Nothing to do" : "Needs your attention"}</p>
      </div>
      <ArrowRight size={16} className="shrink-0 text-ink/30 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
    </Link>
  );
}

function SectionTitle({ title, href, linkLabel = "View all" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink/10 px-5 py-4 sm:px-6">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink">{title}</h2>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 text-xs font-medium text-ink/60 transition-colors hover:text-rose">
          {linkLabel} <ArrowRight size={13} />
        </Link>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const data = await loadDashboard();
  const { kpis } = data;

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Greeting */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-rose">{longDate.format(new Date())}</p>
          <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">
            {greeting()}
            {data.firstName && data.firstName !== "Devon" ? `, ${data.firstName}` : ""}
          </h1>
          <p className="mt-1.5 text-sm text-muted">Here&apos;s how Devon Collection is doing over the last 30 days.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/" target="_blank" className={ui.btnGhost}>
            <ExternalLink size={14} /> View store
          </Link>
          <Link href="/admin/products/new" className={ui.btn}>
            <Plus size={14} /> New product
          </Link>
        </div>
      </header>

      {data.error && <p className="border-l-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">{data.error}</p>}

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi label="Revenue" value={formatPrice(kpis.revenue)} icon={<TrendingUp size={16} />}>
          <Delta now={kpis.revenue} before={kpis.prevRevenue} />
        </Kpi>
        <Kpi label="Orders" value={kpis.orders.toLocaleString("en")} icon={<ShoppingBag size={16} />}>
          <Delta now={kpis.orders} before={kpis.prevOrders} />
        </Kpi>
        <Kpi label="Avg. order" value={formatPrice(Math.round(kpis.aov * 100) / 100)} icon={<Receipt size={16} />}>
          <Delta now={kpis.aov} before={kpis.prevAov} />
        </Kpi>
        <Kpi label="Customers" value={kpis.customers.toLocaleString("en")} icon={<Users size={16} />}>
          <Delta now={kpis.customers} before={kpis.prevCustomers} />
        </Kpi>
      </section>

      {/* Needs attention */}
      <Card className="grid divide-y divide-ink/10 md:grid-cols-3 md:divide-x md:divide-y-0">
        <Attention href="/admin/orders?status=open" icon={<Clock size={18} />} count={data.toProcess} label={data.toProcess === 1 ? "order to process" : "orders to process"} done="All orders handled" />
        <Attention href="/admin/inventory?filter=low" icon={<Boxes size={18} />} count={data.lowStock.length} label={data.lowStock.length === 1 ? "item low on stock" : "items low on stock"} done="Stock looks healthy" />
        <Attention href="/admin/reviews" icon={<Star size={18} />} count={data.pendingReviews} label={data.pendingReviews === 1 ? "review to moderate" : "reviews to moderate"} done="No reviews waiting" />
      </Card>

      {/* Chart + best sellers */}
      <section className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <Card className="lg:col-span-2">
          <SectionTitle title="Revenue · last 14 days" />
          <div className="p-5 sm:p-6">
            <RevenueChart days={data.days} />
          </div>
        </Card>

        <Card className="flex flex-col">
          <SectionTitle title="Best sellers" href="/admin/products" linkLabel="Products" />
          {data.topProducts.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
              <span className="grid size-11 place-items-center rounded-full bg-paper-light text-ink/50">
                <TrendingUp size={18} />
              </span>
              <p className="mt-4 text-sm font-semibold text-ink">No sales yet</p>
              <p className="mt-1 text-xs text-muted">Your top products will appear here.</p>
            </div>
          ) : (
            <ol className="divide-y divide-ink/5">
              {data.topProducts.map((p, i) => (
                <li key={p.id ?? p.name} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                  <span className="w-4 text-xs font-semibold tabular-nums text-ink/40">{i + 1}</span>
                  <Thumb src={p.image} alt={p.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                    <p className="text-xs tabular-nums text-muted">{p.units} sold</p>
                  </div>
                  <span className="text-sm font-medium tabular-nums text-ink">{formatPrice(p.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </section>

      {/* Recent orders + low stock */}
      <section className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <Card className="lg:col-span-2">
          <SectionTitle title="Recent orders" href="/admin/orders" />
          {data.recent.length === 0 ? (
            <EmptyState icon={<Inbox size={20} />} title="No orders yet" description="New orders will show up here as soon as they're placed." />
          ) : (
            <>
              <MobileList>
                {data.recent.map((o) => (
                  <OrderListItem key={o.id} order={o} />
                ))}
              </MobileList>
              <TableWrap className="hidden md:block">
                <thead>
                  <tr>
                    <th className="!pl-6">Order</th>
                    <th>Customer</th>
                    <th className="text-right">Total</th>
                    <th>Payment</th>
                    <th className="!pr-6">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((o) => (
                    <tr key={o.id} className="transition-colors hover:bg-paper-light/60">
                      <td className="!pl-6">
                        <Link href={`/admin/orders/${o.id}`} className="font-semibold text-ink hover:underline">
                          {o.order_number}
                        </Link>
                        <p className="text-xs text-muted">{formatDate(o.created_at)}</p>
                      </td>
                      <td>
                        <p className="text-ink">{o.full_name}</p>
                        <p className="text-xs text-muted">
                          {o.order_items.reduce((s, i) => s + i.quantity, 0)} item(s)
                        </p>
                      </td>
                      <td className="text-right font-medium tabular-nums">{formatPrice(o.total)}</td>
                      <td>
                        <PaymentStatusBadge status={o.payment_status} />
                      </td>
                      <td className="!pr-6">
                        <OrderStatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </>
          )}
        </Card>

        <Card className="flex flex-col">
          <SectionTitle title="Low stock" href="/admin/inventory?filter=low" linkLabel="Inventory" />
          {data.lowStock.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
              <span className="grid size-11 place-items-center rounded-full bg-rose/12 text-[#a8075f]">
                <CircleCheck size={18} />
              </span>
              <p className="mt-4 text-sm font-semibold text-ink">Everything is well stocked</p>
            </div>
          ) : (
            <ul className="max-h-[420px] divide-y divide-ink/5 overflow-y-auto">
              {data.lowStock.slice(0, 10).map((v) => (
                <li key={v.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                  <Thumb src={v.product?.images?.[0]} alt={v.product?.name ?? ""} size={40} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/products/${v.product?.id}`} className="block truncate text-sm font-medium text-ink hover:underline">
                      {v.product?.name ?? "Unknown product"}
                    </Link>
                    <p className="text-xs text-muted">{[v.size, v.color].filter(Boolean).join(" · ")}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                      v.stock === 0 ? "bg-red-50 text-red-700" : "bg-alert/15 text-[#b4532a]",
                    )}
                  >
                    {v.stock === 0 ? "Out" : `${v.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
