"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Menu, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BRAND } from "@/lib/brand";
import { cartCount, useCart } from "@/lib/cart";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { BagIcon } from "./BagIcon";
import { Logo } from "./Logo";

const NAV = [
  { href: "/shop", label: "Shop all" },
  { href: "/collections/signature-black", label: "Signature Black" },
  { href: "/collections/satin", label: "Satin" },
  { href: "/collections/occasion", label: "Occasion" },
];
const NAV_RIGHT = [
  { href: "/about", label: "Our story" },
  { href: "/track", label: "Track order" },
];

const ANNOUNCEMENTS = ["Free delivery across the UAE over AED 500", "Abaya home service — try before you buy", "Licensed by the DED, Abu Dhabi"];

const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

/** Black announcement bar over an ivory header. Floats transparent over photo heroes (globals.css "Store header"). */
export function Header() {
  const pathname = usePathname();
  const lines = useCart((s) => s.lines);
  const openCart = useCart((s) => s.open);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const mounted = useHydrated();
  const [lastPath, setLastPath] = useState(pathname);
  const count = mounted ? cartCount(lines) : 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the menu after navigating.
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  // Lock page scroll behind the full-screen mobile menu.
  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  const linkClass = (href: string) =>
    cn(
      "group relative py-2 text-[10.5px] font-medium uppercase tracking-[0.24em] transition-colors hover:text-rose",
      isActive(pathname, href) && "text-rose",
    );

  return (
    <header data-scrolled={scrolled || undefined} data-open={menuOpen || undefined} className="site-header inset-x-0 top-0 z-40">
      <div className="overflow-hidden bg-ink text-paper">
        <div className="hidden h-8 items-center justify-center gap-10 text-[10px] uppercase tracking-[0.26em] md:flex">
          {ANNOUNCEMENTS.map((a, i) => (
            <span key={a} className="flex items-center gap-10">
              {i > 0 && <span className="size-1 rounded-full bg-rose" />}
              {a}
            </span>
          ))}
        </div>
        <div className="flex h-8 w-max items-center text-[10px] uppercase tracking-[0.24em] md:hidden">
          <div className="marquee flex shrink-0 items-center">
            {[...ANNOUNCEMENTS, ...ANNOUNCEMENTS].map((a, i) => (
              <span key={i} className="flex items-center gap-6 pr-6">
                <span className="size-1 rounded-full bg-rose" />
                {a}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto grid h-16 max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-5 md:h-[76px] md:px-10">
        <div className="flex items-center">
          <button className="-ml-2.5 p-2.5 lg:hidden" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X className="size-5" strokeWidth={1.4} /> : <Menu className="size-5" strokeWidth={1.4} />}
          </button>
          <nav className="hidden items-center gap-8 lg:flex">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <Logo className="h-7 md:h-9" />

        <div className="-mr-2.5 flex items-center justify-end gap-1 md:mr-0 md:gap-7">
          <nav className="hidden items-center gap-8 lg:flex">
            {NAV_RIGHT.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/account" aria-label="Account" className="p-2.5 transition-colors hover:text-rose md:p-1">
            <UserRound className="size-[1.15rem]" strokeWidth={1.3} />
          </Link>
          <button aria-label="Open bag" onClick={openCart} className="relative p-2.5 transition-colors hover:text-rose md:p-1">
            <BagIcon className="size-[1.3rem]" />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  className="absolute right-0.5 top-1 grid size-4 place-items-center rounded-full bg-rose text-[9px] font-semibold text-white md:-right-1.5 md:-top-1"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex h-[calc(100svh-6rem)] flex-col overflow-y-auto border-t border-line bg-paper px-6 pb-8 pt-4 text-ink lg:hidden"
          >
            {[...NAV, ...NAV_RIGHT, { href: "/account", label: "My account" }].map((item, i) => (
              <motion.div key={item.href} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
                <Link
                  href={item.href}
                  className={cn("block border-b border-line py-4 font-serif text-2xl", isActive(pathname, item.href) && "italic text-rose")}
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
            <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer" className="eyebrow mt-auto pt-8 text-muted">
              {BRAND.instagramHandle}
            </a>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
