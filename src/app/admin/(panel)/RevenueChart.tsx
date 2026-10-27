import { cn, formatPrice } from "@/lib/utils";

export type DayRevenue = { key: string; label: string; weekday: string; revenue: number; orders: number };

function niceMax(value: number) {
  if (value <= 0) return 100;
  const pow = 10 ** Math.floor(Math.log10(value));
  const n = value / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

/** Single-series bar chart (plain divs) with a hover tooltip per bar. */
export function RevenueChart({ days }: { days: DayRevenue[] }) {
  const max = niceMax(Math.max(...days.map((d) => d.revenue), 0));
  const ticks = [max, max / 2, 0];
  const total = days.reduce((s, d) => s + d.revenue, 0);
  const orders = days.reduce((s, d) => s + d.orders, 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[26px] font-semibold leading-none tracking-tight text-ink tabular-nums">{formatPrice(total)}</p>
          <p className="mt-2 text-xs text-muted">
            {orders} order{orders === 1 ? "" : "s"} in the last 14 days
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <div className="flex h-48 flex-col justify-between pb-6 text-right text-[10px] tabular-nums text-muted">
          {ticks.map((t) => (
            <span key={t} className="-translate-y-1/2 leading-none">
              {t >= 1000 ? `${(t / 1000).toLocaleString("en", { maximumFractionDigits: 1 })}k` : t}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          {total === 0 && (
            <div className="absolute inset-x-0 top-0 bottom-6 z-10 grid place-items-center">
              <p className="bg-white/90 px-3 py-1.5 text-xs text-muted">No sales in this period yet</p>
            </div>
          )}
          {/* gridlines */}
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
            {ticks.map((t) => (
              <div key={t} className="border-t border-ink/[0.07]" />
            ))}
          </div>
          <div className="relative flex h-48 items-stretch gap-[2px]">
            {days.map((d, i) => {
              const pct = (d.revenue / max) * 100;
              return (
                <div key={d.key} className="group relative flex flex-1 flex-col items-center">
                  <div className="flex w-full flex-1 items-end justify-center pb-0">
                    <div
                      className="w-full max-w-8 rounded-t-[3px] bg-ink transition-colors group-hover:bg-rose"
                      style={{ height: d.revenue > 0 ? `max(${pct}%, 3px)` : 0 }}
                    />
                  </div>
                  <span className="mt-2 h-4 whitespace-nowrap text-[10px] tabular-nums text-muted">
                    {i % 2 === days.length % 2 ? d.label : ""}
                  </span>
                  {/* tooltip */}
                  <div
                    className={cn(
                      "pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap bg-ink-deep px-3 py-2 text-[11px] text-paper shadow-lg group-hover:block",
                      // Keep the edge tooltips on screen on narrow viewports.
                      i < 2 ? "left-0" : i >= days.length - 2 ? "right-0" : "left-1/2 -translate-x-1/2",
                    )}
                  >
                    <p className="font-semibold">
                      {d.weekday} {d.label}
                    </p>
                    <p className="tabular-nums">{formatPrice(d.revenue)}</p>
                    <p className="text-paper/60">
                      {d.orders} order{d.orders === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
