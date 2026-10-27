import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/store/CheckoutForm";
import { getSession } from "@/lib/auth";
import { getStoreSettings } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const settings = await getStoreSettings();
  const session = isSupabaseConfigured ? await getSession() : null;
  return (
    <div className="mx-auto max-w-[1200px] px-5 pb-24 pt-12 md:px-10 md:pt-20">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink/10 pb-6">
        <div>
          <p className="eyebrow text-ink/50">Bag · Details · Done</p>
          <h1 className="mt-2 font-script text-5xl leading-none md:text-6xl">Checkout</h1>
        </div>
        <Link href="/shop" className="text-xs text-muted underline-offset-4 hover:text-ink hover:underline">
          Continue shopping
        </Link>
      </div>
      <CheckoutForm
        shippingFlat={settings.shipping_flat}
        freeShippingThreshold={settings.free_shipping_threshold}
        defaults={{
          email: session?.user?.email ?? "",
          full_name: session?.profile?.full_name ?? "",
          phone: session?.profile?.phone ?? "",
        }}
      />
    </div>
  );
}
