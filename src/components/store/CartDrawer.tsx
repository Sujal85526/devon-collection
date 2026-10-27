"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Gift, Minus, Plus, ShieldCheck, Trash2, Truck, X } from "lucide-react";
import { useEffect } from "react";
import { cartCount, cartSubtotal, useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Slide-in bag from the right: script heading, free-delivery progress, lines with a
 * quantity stepper and remove, subtotal, the way to checkout and two reassurance badges.
 */
export function CartDrawer({ freeShippingThreshold }: { freeShippingThreshold: number }) {
  const { lines, isOpen, close, setQuantity, remove } = useCart();
  const pathname = usePathname();
  const subtotal = cartSubtotal(lines);
  const count = cartCount(lines);
  const remaining = Math.max(0, freeShippingThreshold - subtotal);
  const progress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  useEffect(() => close(), [pathname, close]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.aside
            role="dialog"
            aria-label="Shopping bag"
            className="fixed inset-y-1.5 right-1.5 z-50 flex w-[calc(100vw-0.75rem)] max-w-md flex-col overflow-hidden rounded-[1.25rem] bg-paper shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.55, ease }}
          >
            <div className="flex items-center justify-between px-6 pb-2 pt-7 sm:px-8">
              <h2 className="font-script text-3xl leading-none">
                Your bag{count > 0 && <span className="ml-2 text-base text-ink/50">({count})</span>}
              </h2>
              <button onClick={close} aria-label="Close bag" className="grid size-10 place-items-center rounded-full transition-colors hover:bg-ink/5">
                <X className="size-5" strokeWidth={1.4} />
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
                <div>
                  <p className="font-script text-3xl">Your bag is <em>empty</em></p>
                  <p className="mt-2 text-sm text-muted">Your next favourite abaya is waiting.</p>
                </div>
                <Link href="/shop" className="btn-primary" onClick={close}>
                  Shop the collection
                </Link>
              </div>
            ) : (
              <div className="flex flex-1 flex-col overflow-y-auto px-6 sm:px-8">
                {/* Free delivery */}
                <div className="mt-5 flex items-center gap-4 rounded-xl bg-paper-light px-4 py-3.5">
                  <Gift className="size-6 shrink-0 text-ink" strokeWidth={1.2} aria-hidden />
                  <div className="flex-1">
                    <p className="text-[13px] text-ink">
                      {remaining > 0 ? (
                        <>
                          Spend <strong className="font-semibold">{formatPrice(remaining)}</strong> more for free delivery
                        </>
                      ) : (
                        <>You&apos;ve unlocked <strong className="font-semibold">free delivery</strong></>
                      )}
                    </p>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
                      <motion.div className="h-full bg-rose" initial={false} animate={{ width: `${progress}%` }} transition={{ duration: 0.7, ease }} />
                    </div>
                  </div>
                </div>

                {/* Lines */}
                <ul className="mt-5 divide-y divide-ink/10 border-b border-ink/10">
                  <AnimatePresence initial={false}>
                    {lines.map((line, i) => (
                      <motion.li
                        key={line.variantId}
                        layout
                        initial={{ opacity: 0, x: -14 }}
                        animate={{ opacity: 1, x: 0, transition: { delay: 0.12 + i * 0.05, duration: 0.5, ease } }}
                        exit={{ opacity: 0, height: 0, transition: { duration: 0.3 } }}
                        className="flex gap-4 py-5"
                      >
                        <Link href={`/product/${line.slug}`} onClick={close} className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-lg bg-paper-deep sm:w-24">
                          {line.image ? (
                            <Image src={line.image} alt={line.name} fill sizes="96px" className="object-cover" />
                          ) : (
                            <Image src="/brand/logo-white.png" alt="" fill sizes="96px" className="object-contain p-3 opacity-20" />
                          )}
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <Link href={`/product/${line.slug}`} onClick={close} className="block truncate text-[15px] font-medium leading-tight tracking-tight hover:underline">
                                {line.name}
                              </Link>
                              {line.variantLabel && <p className="mt-1 text-xs text-muted">{line.variantLabel}</p>}
                            </div>
                            <button
                              onClick={() => remove(line.variantId)}
                              aria-label={`Remove ${line.name}`}
                              className="grid size-8 shrink-0 place-items-center rounded-full text-ink/40 transition-colors hover:bg-ink/5 hover:text-alert"
                            >
                              <Trash2 className="size-4" strokeWidth={1.4} />
                            </button>
                          </div>
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="flex items-center rounded-full bg-paper-light">
                              <button className="grid size-8 place-items-center hover:bg-ink/5" aria-label="Decrease" onClick={() => setQuantity(line.variantId, line.quantity - 1)}>
                                <Minus className="size-3" />
                              </button>
                              <span className="w-6 text-center text-xs tabular-nums">{line.quantity}</span>
                              <button
                                className="grid size-8 place-items-center hover:bg-ink/5 disabled:opacity-30"
                                aria-label="Increase"
                                disabled={line.quantity >= line.maxStock}
                                onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                              >
                                <Plus className="size-3" />
                              </button>
                            </div>
                            <p className="text-sm font-medium tabular-nums">{formatPrice(line.price * line.quantity)}</p>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>

                {/* Totals */}
                <dl className="mt-5 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="font-medium">Subtotal</dt>
                    <dd className="font-medium tabular-nums">{formatPrice(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between text-ink/70">
                    <dt>Delivery</dt>
                    <dd>{remaining === 0 ? "Free" : "Calculated at checkout"}</dd>
                  </div>
                </dl>

                <Link href="/checkout" onClick={close} className="btn-primary mt-6 h-14 w-full shrink-0">
                  Proceed to checkout →
                </Link>

                {/* Reassurance */}
                <div className="mt-6 grid grid-cols-2 pb-8 text-xs text-ink">
                  <div className="flex items-center justify-center gap-3">
                    <Truck className="size-6 shrink-0" strokeWidth={1.1} aria-hidden />
                    <span>
                      Fast UAE delivery
                      <span className="block text-ink/55">1–3 working days</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-3 border-l border-ink/15">
                    <ShieldCheck className="size-6 shrink-0" strokeWidth={1.1} aria-hidden />
                    <span>
                      Pay on delivery
                      <span className="block text-ink/55">Cash or card</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
