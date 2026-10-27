import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, LogOut, Package, Truck } from "lucide-react";
import { ChangePassword } from "@/components/store/ChangePassword";
import { getSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Order } from "@/lib/types";
import { cn, formatDate, formatPrice, ORDER_STATUS_LABELS } from "@/lib/utils";
import { signOut, updateProfile } from "./actions";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

type OrderWithItems = Order & { order_items: { product_name: string; image_url: string | null; quantity: number }[] };

const statusTone = (s: string) =>
  s === "delivered" ? "bg-sage/25 text-[#4f6312]" : s === "cancelled" || s === "returned" ? "bg-ink/5 text-ink/60" : s === "shipped" || s === "out_for_delivery" ? "bg-rose/15 text-[#a8075f]" : "bg-alert/15 text-[#b4532a]";

export default async function AccountPage() {
  if (!isSupabaseConfigured) redirect("/account/login");
  const { supabase, user, profile } = await getSession();
  if (!user) redirect("/account/login");
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(product_name, image_url, quantity)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as OrderWithItems[];
  const firstName = profile?.full_name?.split(" ")[0];
  const spent = orders.filter((o) => o.status !== "cancelled" && o.status !== "returned").reduce((s, o) => s + Number(o.total), 0);
  const open = orders.filter((o) => !["delivered", "cancelled", "returned"].includes(o.status)).length;

  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-28 pt-16 md:px-10 md:pt-24">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="mt-5 font-script text-5xl leading-none md:text-6xl">Hello{firstName ? `, ${firstName}` : ""}</h1>
          <p className="mt-3 text-sm text-muted">{user.email}</p>
        </div>
        <div className="flex gap-3">
          {profile?.role === "admin" && (
            <Link href="/admin" className="btn-outline">
              Admin
            </Link>
          )}
          <form action={signOut}>
            <button className="btn-outline">
              <LogOut className="size-3.5" strokeWidth={1.5} /> Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Summary */}
      <section className="mt-10 grid grid-cols-3 gap-3 sm:gap-4">
        {[
          ["Orders", String(orders.length)],
          ["In progress", String(open)],
          ["Total spent", formatPrice(spent)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-paper p-4 sm:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-ink/55">{label}</p>
            <p className="mt-3 font-serif text-2xl tabular-nums lining-nums sm:text-3xl">{value}</p>
          </div>
        ))}
      </section>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <section>
          <h2 className="mb-5 font-script text-5xl leading-none">Your orders</h2>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-paper px-6 py-14 text-center">
              <Package className="size-7 text-ink/40" strokeWidth={1.2} />
              <p className="font-serif text-xl italic">No orders yet</p>
              <Link href="/shop" className="btn-primary">
                Start shopping
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/order/${o.order_number}`} className="group flex items-center gap-4 rounded-2xl bg-paper p-4 transition-colors hover:bg-white sm:p-5">
                    <div className="flex -space-x-3">
                      {o.order_items.slice(0, 3).map((it, i) => (
                        <div key={i} className="relative size-12 overflow-hidden border-2 border-white bg-paper-light sm:size-14">
                          {it.image_url && <Image src={it.image_url} alt={it.product_name} fill sizes="56px" className="object-cover" />}
                        </div>
                      ))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{o.order_number}</p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {formatDate(o.created_at)} · {o.order_items.reduce((s, i) => s + i.quantity, 0)} item(s)
                      </p>
                    </div>
                    <span className={cn("hidden rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.04em] sm:inline-block", statusTone(o.status))}>
                      {ORDER_STATUS_LABELS[o.status]}
                    </span>
                    <span className="text-sm font-medium tabular-nums">{formatPrice(o.total)}</span>
                    <ArrowRight className="size-4 text-ink/30 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/track" className="mt-5 inline-flex items-center gap-2 text-xs text-muted hover:text-ink">
            <Truck className="size-4" strokeWidth={1.4} /> Track an order by number
          </Link>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl bg-paper p-6">
            <h2 className="font-serif text-2xl">Your details</h2>
            <form action={updateProfile} className="mt-5 space-y-4">
              <label className="block">
                <span className="label">Full name</span>
                <input name="full_name" defaultValue={profile?.full_name ?? ""} className="field" autoComplete="name" />
              </label>
              <label className="block">
                <span className="label">Phone</span>
                <input name="phone" defaultValue={profile?.phone ?? ""} className="field" autoComplete="tel" placeholder="+971 50 000 0000" />
              </label>
              <button className="btn-primary w-full">Save details</button>
            </form>
          </section>
          <section className="rounded-2xl bg-paper p-6">
            <h2 className="font-serif text-2xl">Password</h2>
            <div className="mt-5">
              <ChangePassword />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
