"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { checkCoupon, placeOrder } from "@/app/(store)/checkout/actions";
import { cartSubtotal, useCart } from "@/lib/cart";
import { useHydrated } from "@/lib/use-hydrated";
import { EMIRATES, formatPrice } from "@/lib/utils";
import { ChevronDown, Lock, RotateCcw, Truck } from "lucide-react";

type Props = {
  shippingFlat: number;
  freeShippingThreshold: number;
  defaults: { email: string; full_name: string; phone: string };
};

export function CheckoutForm({ shippingFlat, freeShippingThreshold, defaults }: Props) {
  const router = useRouter();
  const { lines, clear } = useCart();
  const mounted = useHydrated();
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [checking, startChecking] = useTransition();
  const [placing, startPlacing] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const subtotal = cartSubtotal(lines);
  const discount = coupon ? Math.min(coupon.discount, subtotal) : 0;
  const shipping = subtotal - discount >= freeShippingThreshold ? 0 : shippingFlat;
  const total = subtotal - discount + shipping;

  // Re-check the coupon whenever the bag changes, since minimums and percentages depend on the subtotal.
  useEffect(() => {
    if (!coupon) return;
    checkCoupon(coupon.code, subtotal).then((res) => {
      if (res.valid && res.code) setCoupon({ code: res.code, discount: Number(res.discount) });
      else {
        setCoupon(null);
        toast(res.message);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  function applyCoupon() {
    if (!couponInput.trim()) return;
    startChecking(async () => {
      const res = await checkCoupon(couponInput, subtotal);
      if (res.valid && res.code) {
        setCoupon({ code: res.code, discount: Number(res.discount) });
        toast(`${res.code} applied`);
      } else toast(res.message);
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const get = (k: string) => f.get(k)?.toString() ?? "";
    startPlacing(async () => {
      const res = await placeOrder({
        items: lines.map((l) => ({ variant_id: l.variantId, quantity: l.quantity })),
        customer: {
          email: get("email"),
          full_name: get("full_name"),
          phone: get("phone"),
          payment_method: "cod",
          address: {
            line1: get("line1"),
            line2: get("line2"),
            city: get("city"),
            emirate: get("emirate"),
            country: "United Arab Emirates",
            notes: get("notes"),
          },
        },
        coupon: coupon?.code,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      clear();
      router.push(`/order/${res.orderNumber}?email=${encodeURIComponent(res.email)}&new=1`);
    });
  }

  if (!mounted) return <div className="h-96" />;

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="font-serif text-2xl">Your bag is empty.</p>
        <Link href="/shop" className="btn-primary mt-3">
          Continue shopping
        </Link>
      </div>
    );
  }

  const itemCount = lines.reduce((n, l) => n + l.quantity, 0);

  const items = (
    <ul className="space-y-4">
      {lines.map((l) => (
        <li key={l.variantId} className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="relative aspect-[3/4] w-16 overflow-hidden bg-paper">
              {l.image && <Image src={l.image} alt={l.name} fill sizes="64px" className="object-cover" />}
            </div>
            <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-ink text-[10px] font-semibold text-paper">
              {l.quantity}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{l.name}</p>
            {l.variantLabel && <p className="mt-0.5 text-xs text-muted">{l.variantLabel}</p>}
          </div>
          <p className="text-sm tabular-nums">{formatPrice(l.price * l.quantity)}</p>
        </li>
      ))}
    </ul>
  );

  const couponField = (
    <div>
      <div className="flex gap-2">
        <input
          value={couponInput}
          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              applyCoupon();
            }
          }}
          placeholder="Discount code"
          aria-label="Discount code"
          className="checkout-input uppercase placeholder:normal-case"
        />
        <button
          type="button"
          onClick={applyCoupon}
          disabled={checking || !couponInput.trim()}
          className="h-12 shrink-0 border border-ink px-5 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors hover:bg-ink hover:text-paper disabled:border-ink/20 disabled:text-ink/40 disabled:hover:bg-transparent"
        >
          {checking ? "…" : "Apply"}
        </button>
      </div>
    </div>
  );

  const totals = (
    <dl className="space-y-3 text-sm">
      <div className="flex justify-between">
        <dt className="text-ink/70">Subtotal · {itemCount} {itemCount === 1 ? "item" : "items"}</dt>
        <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
      </div>
      {coupon && (
        <div className="flex items-center justify-between">
          <dt className="flex items-center gap-2 text-ink/70">
            Discount
            <span className="inline-flex items-center gap-1.5 bg-rose/12 px-2 py-0.5 text-[10px] font-semibold tracking-[0.15em] text-[#a8075f]">
              {coupon.code}
              <button type="button" aria-label="Remove code" className="text-[#a8075f]/70 hover:text-[#a8075f]" onClick={() => setCoupon(null)}>
                ×
              </button>
            </span>
          </dt>
          <dd className="tabular-nums text-[#a8075f]">−{formatPrice(discount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-ink/70">Delivery</dt>
        <dd className="tabular-nums">{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
      </div>
      <div className="flex items-baseline justify-between border-t border-ink/10 pt-4">
        <dt className="text-base font-semibold">Total</dt>
        <dd className="text-xl font-semibold tabular-nums">
          <span className="mr-1.5 text-xs font-normal text-muted">AED</span>
          {formatPrice(total).replace("AED ", "")}
        </dd>
      </div>
    </dl>
  );

  const placeOrderButton = (
    <>
      {error && <p className="mb-4 border-l-2 border-alert bg-alert/10 px-4 py-3 text-sm text-ink">{error}</p>}
      <button disabled={placing} className="btn-primary h-14 w-full text-xs">
        <Lock className="size-3.5" strokeWidth={2} />
        {placing ? "Placing order…" : "Place order"}
      </button>
    </>
  );

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-8 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-14">
      {/* Mobile: collapsible order summary */}
      <div className="overflow-hidden border border-line bg-white lg:hidden">
        <button
          type="button"
          onClick={() => setSummaryOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-4 text-sm"
          aria-expanded={summaryOpen}
        >
          <span className="flex items-center gap-2 font-medium text-rose">
            {summaryOpen ? "Hide" : "Show"} order summary
            <ChevronDown className={`size-4 transition-transform ${summaryOpen ? "rotate-180" : ""}`} />
          </span>
          <span className="font-semibold tabular-nums">{formatPrice(total)}</span>
        </button>
        {summaryOpen && (
          <div className="space-y-6 border-t border-ink/10 px-4 py-6">
            {items}
            {totals}
          </div>
        )}
      </div>

      <div className="space-y-10">
        <section>
          <StepTitle n={1} title="Contact" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" className="sm:col-span-2">
              <input name="email" type="email" required defaultValue={defaults.email} className="checkout-input" autoComplete="email" placeholder="you@example.com" />
            </Field>
            <Field label="Full name">
              <input name="full_name" required defaultValue={defaults.full_name} className="checkout-input" autoComplete="name" />
            </Field>
            <Field label="Phone">
              <input name="phone" type="tel" required defaultValue={defaults.phone} placeholder="+971 50 000 0000" className="checkout-input" autoComplete="tel" />
            </Field>
          </div>
        </section>

        <section>
          <StepTitle n={2} title="Delivery" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Street address" className="sm:col-span-2">
              <input name="line1" required className="checkout-input" autoComplete="address-line1" placeholder="Building, street, villa or apartment" />
            </Field>
            <Field label="Apartment, landmark (optional)" className="sm:col-span-2">
              <input name="line2" className="checkout-input" autoComplete="address-line2" />
            </Field>
            <Field label="Area / City">
              <input name="city" required className="checkout-input" autoComplete="address-level2" placeholder="e.g. Al Reem Island" />
            </Field>
            <Field label="Emirate">
              <select name="emirate" required defaultValue="Abu Dhabi" className="checkout-input cursor-pointer">
                {EMIRATES.map((e) => (
                  <option key={e}>{e}</option>
                ))}
              </select>
            </Field>
            <Field label="Delivery notes (optional)" className="sm:col-span-2">
              <textarea name="notes" rows={3} className="checkout-input h-auto resize-none py-3" placeholder="Gate code, best time to call…" />
            </Field>
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs text-muted">
            <Truck className="size-4 text-rose" strokeWidth={1.6} />
            Delivered across the UAE in 1–3 working days, gift-boxed.
          </p>
        </section>

        <section>
          <StepTitle n={3} title="Payment" />
          <label className="flex cursor-pointer items-start gap-4 border border-ink bg-white p-5">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 border-ink">
              <span className="size-2.5 rounded-full bg-ink" />
            </span>
            <input type="radio" name="payment" defaultChecked className="sr-only" />
            <span className="flex-1">
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">Cash on delivery</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Cash or card</span>
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted">Pay the courier when your order arrives.</span>
            </span>
          </label>
          <p className="mt-3 text-xs text-muted">Online card payments are coming soon.</p>
        </section>

        {/* Mobile: totals + place order at the end of the form */}
        <div className="space-y-6 border-t border-ink/10 pt-8 lg:hidden">
          {couponField}
          {totals}
          {placeOrderButton}
          <Assurances freeOver={freeShippingThreshold} />
        </div>
      </div>

      {/* Desktop: sticky summary */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 bg-white p-8 border border-line">
          <h2 className="eyebrow mb-6">Order summary</h2>
          {items}
          <div className="my-6 border-t border-ink/10" />
          {couponField}
          <div className="my-6 border-t border-ink/10" />
          {totals}
          <div className="mt-6">{placeOrderButton}</div>
          <div className="mt-6">
            <Assurances freeOver={freeShippingThreshold} />
          </div>
        </div>
      </aside>
    </form>
  );
}

function StepTitle({ n, title }: { n: number; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="grid size-7 place-items-center rounded-full bg-ink text-xs font-semibold text-paper">{n}</span>
      <h2 className="font-script text-[34px] leading-none">{title}</h2>
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={className}>
      <span className="mb-2 block text-xs font-medium text-ink/80">{label}</span>
      {children}
    </label>
  );
}

function Assurances({ freeOver }: { freeOver: number }) {
  return (
    <ul className="grid grid-cols-3 gap-2 text-center text-[11px] leading-snug text-muted">
      <li className="flex flex-col items-center gap-1.5">
        <Truck className="size-4 text-ink/60" strokeWidth={1.5} />
        Free delivery over {formatPrice(freeOver)}
      </li>
      <li className="flex flex-col items-center gap-1.5">
        <RotateCcw className="size-4 text-ink/60" strokeWidth={1.5} />
        7-day exchange
      </li>
      <li className="flex flex-col items-center gap-1.5">
        <Lock className="size-4 text-ink/60" strokeWidth={1.5} />
        Pay on delivery
      </li>
    </ul>
  );
}
