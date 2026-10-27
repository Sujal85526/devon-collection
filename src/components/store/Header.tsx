"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BRAND } from "@/lib/brand";
import { cartCount, useCart } from "@/lib/cart";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { BagIcon } from "./BagIcon";
import { InstagramIcon } from "./InstagramIcon";
import { Logo } from "./Logo";

const FEATURED = [
  { href: "/shop", label: "Shop all" },
  { href: "/collections/signature-black", label: "Signature Black" },
  { href: "/collections/satin", label: "Satin Open Abayas" },
  { href: "/collections/occasion", label: "Occasion" },
];
const HELP = [
  { href: "/about", label: "Our story" },
  { href: "/about#sizing", label: "Size guide" },
  { href: "/about#delivery", label: "Delivery & returns" },
  { href: "/track", label: "Track your order" },
  { href: "/account", label: "My account" },
];

/**
 * Fixed bar: text links left, wordmark centre, icons and a pill menu button right. Transparent with
 * white type over a photo hero ([data-hero]) until the page scrolls, a solid white bar elsewhere.
 */
export function Header() {
  const pathname = usePathname();
  const lines = useCart((s) => s.lines);
  const openCart = useCart((s) => s.open);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const mounted = useHydrated();
  const count = mounted ? cartCount(lines) : 0;
  const home = pathname === "/";
  const clear = home && !scrolled && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the menu after navigating.
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const link = "hidden transition-opacity hover:opacity-60 lg:block";

  return (
    <>
      <header className={cn("fixed inset-x-0 top-0 z-50 transition-colors duration-300", clear ? "bg-transparent text-white" : "bg-paper text-ink")}>
        <nav className="relative flex h-14 items-center justify-between px-3 text-[13px] sm:px-5">
          <div className="flex flex-1 items-center gap-7">
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className={cn(
                "flex h-8 items-center gap-2 rounded-full pl-1 pr-3.5 text-xs transition-colors lg:hidden",
                clear ? "bg-white/20 backdrop-blur-md" : "bg-paper-light",
              )}
            >
              <span className={cn("grid size-6 place-items-center rounded-full", clear ? "bg-white/25" : "bg-paper-deep")}>
                {open ? <X className="size-3.5" strokeWidth={1.75} /> : <MenuGlyph />}
              </span>
              Menu
            </button>
            <Link href="/shop" className={link}>Shop all</Link>
            {FEATURED.slice(1).map((l) => (
              <Link key={l.href} href={l.href} className={link}>
                {l.label}
              </Link>
            ))}
          </div>

          <Logo light={clear} className="absolute left-1/2 h-5 -translate-x-1/2 sm:h-6" />

          <div className="flex flex-1 items-center justify-end gap-0.5 sm:gap-1.5">
            <Link href="/about" className={cn(link, "mr-4")}>Our story</Link>
            <Link href="/track" className={cn(link, "mr-3")}>Track order</Link>
            <Link href="/account" aria-label="Account" className="p-2 transition-opacity hover:opacity-60">
              <UserRound className="size-[19px]" strokeWidth={1.4} />
            </Link>
            <button type="button" aria-label="Open bag" onClick={openCart} className="relative p-2 transition-opacity hover:opacity-60">
              <BagIcon className="size-5" />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    className="absolute right-0 top-0 grid min-w-4 place-items-center rounded-full bg-rose px-1 text-[10px] font-medium leading-4 tabular-nums text-white"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className={cn(
                "ml-2 hidden h-[26px] w-[42px] place-items-center rounded-full transition-colors lg:grid",
                clear ? "bg-white/90 text-black" : "bg-paper-light hover:bg-paper-deep",
              )}
            >
              {open ? <X className="size-4" strokeWidth={1.5} /> : <MenuGlyph wide />}
            </button>
          </div>
        </nav>

        {/* The page's rounded top corners, tucked under the solid bar. */}
        {!clear && (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-full flex justify-between">
            <span className="size-4 bg-[radial-gradient(circle_at_100%_100%,transparent_15.5px,var(--color-paper)_16px)]" />
            <span className="size-4 bg-[radial-gradient(circle_at_0_100%,transparent_15.5px,var(--color-paper)_16px)]" />
          </div>
        )}
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setOpen(false)}
            />
            <motion.div
              key="sheet"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 top-14 z-40 max-h-[calc(100dvh-3.5rem)] overflow-y-auto bg-paper px-2 pb-2"
            >
              <div className="grid gap-8 rounded-2xl bg-paper-light p-6 lg:grid-cols-[1.2fr_1.4fr_1fr] lg:p-8">
                <ul className="space-y-2">
                  {FEATURED.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-xl font-medium tracking-[-0.035em] transition-colors hover:text-rose lg:text-2xl">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div>
                  <p className="text-[13px] font-semibold">Help</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {HELP.map((l) => (
                      <Link key={l.href} href={l.href} className="rounded-full bg-paper px-3 py-1.5 text-xs transition-colors hover:bg-ink hover:text-paper">
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="text-[13px] text-ink/70">
                  <p className="font-semibold text-ink">Free delivery over AED 500</p>
                  <p className="mt-2 leading-relaxed">Abaya home service across the UAE. Licensed by the DED, Abu Dhabi.</p>
                  <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 transition-colors hover:text-rose">
                    <InstagramIcon className="size-4" /> {BRAND.instagramHandle}
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function MenuGlyph({ wide }: { wide?: boolean }) {
  return (
    <span className={cn("flex flex-col gap-[3px]", wide ? "w-4" : "w-3")}>
      <span className="h-px w-full bg-current" />
      <span className="h-px w-full bg-current" />
    </span>
  );
}
