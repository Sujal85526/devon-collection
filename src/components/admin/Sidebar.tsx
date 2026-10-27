"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  Star,
  Tags,
  TicketPercent,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StoreSwitch } from "./StoreSwitch";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
];

type Counts = { pendingOrders: number; pendingReviews: number };

function NavLinks({ counts, onNavigate }: { counts: Counts; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        const badge = href === "/admin/orders" ? counts.pendingOrders : href === "/admin/reviews" ? counts.pendingReviews : 0;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors",
              active ? "bg-paper/10 text-paper" : "text-paper/60 hover:bg-paper/5 hover:text-paper",
            )}
          >
            <span className={cn("h-4 w-0.5 -ml-4 mr-1 transition-colors", active ? "bg-rose" : "bg-transparent")} />
            <Icon size={16} strokeWidth={1.75} />
            <span className="flex-1">{label}</span>
            {badge > 0 && (
              <span className="min-w-5 rounded-full bg-alert px-1.5 text-center text-[10px] font-semibold leading-5 text-white">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function Footer({ email, signOut, storeOpen }: { email: string; signOut: () => Promise<void>; storeOpen: boolean }) {
  return (
    <div className="border-t border-paper/10 px-4 pt-4">
      <div className="-mx-2 mb-4">
        <StoreSwitch open={storeOpen} />
      </div>
      <Link
        href="/"
        target="_blank"
        className="mb-3 flex items-center gap-2 text-[12px] text-paper/60 transition-colors hover:text-paper"
      >
        <ExternalLink size={14} /> View storefront
      </Link>
      <p className="truncate text-[11px] text-paper/40" title={email}>
        {email}
      </p>
      <form action={signOut}>
        <button
          type="submit"
          className="mt-2 flex items-center gap-2 text-[12px] font-medium text-paper/80 transition-colors hover:text-alert"
        >
          <LogOut size={14} /> Sign out
        </button>
      </form>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/admin" className="flex items-end gap-3" aria-label="Devon Collection admin home">
      <Image
        src="/brand/logo-pink.png"
        alt="Devon Collection"
        width={960}
        height={220}
        className={compact ? "h-6 w-auto" : "h-8 w-auto"}
        priority
      />
      <span className="mb-1 text-[9px] font-semibold uppercase tracking-[0.3em] text-rose">Admin</span>
    </Link>
  );
}

export function Sidebar({
  email,
  counts,
  signOut,
  storeOpen,
}: {
  email: string;
  counts: Counts;
  signOut: () => Promise<void>;
  storeOpen: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-ink py-6 lg:flex print:hidden">
        <div className="px-6 pb-8">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          <NavLinks counts={counts} />
        </div>
        <Footer email={email} signOut={signOut} storeOpen={storeOpen} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-ink px-4 py-3 lg:hidden print:hidden">
        <Brand compact />
        <button type="button" onClick={() => setOpen(true)} className="-mr-2 flex h-10 w-10 items-center justify-center text-paper" aria-label="Open menu">
          <Menu size={22} />
        </button>
      </header>

      {/* Mobile drawer */}
      <div className={cn("fixed inset-0 z-50 lg:hidden print:hidden", open ? "pointer-events-auto" : "pointer-events-none")}>
        <div
          className={cn("absolute inset-0 bg-ink-deep/60 transition-opacity", open ? "opacity-100" : "opacity-0")}
          onClick={() => setOpen(false)}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-ink py-5 transition-transform duration-300 ease-out-soft",
            open ? "translate-x-0" : "-translate-x-full",
          )}
          aria-hidden={!open}
        >
          <div className="flex items-center justify-between px-5 pb-6">
            <Brand />
            <button type="button" onClick={() => setOpen(false)} className="-mr-2 flex h-10 w-10 items-center justify-center text-paper/70" aria-label="Close menu">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2">
            <NavLinks counts={counts} onNavigate={() => setOpen(false)} />
          </div>
          <Footer email={email} signOut={signOut} storeOpen={storeOpen} />
        </aside>
      </div>
    </>
  );
}
