import Image from "next/image";
import { BRAND } from "@/lib/brand";

/** Shown in place of the whole storefront while the store is switched off in the admin. */
export function ComingSoon() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-center text-paper">
      <Image src="/brand/logo-pink.png" alt="Devon Collection" width={960} height={220} priority className="h-14 w-auto md:h-20" />
      <p className="eyebrow mt-12 text-paper/60">{BRAND.tagline}</p>
      <h1 className="mt-4 font-serif text-4xl italic md:text-6xl">Back very soon.</h1>
      <p className="mt-6 max-w-sm text-sm leading-relaxed text-paper/70">
        We&apos;re preparing something new. Follow{" "}
        <a href={BRAND.instagram} className="text-rose underline-offset-4 hover:underline">
          {BRAND.instagramHandle}
        </a>{" "}
        for the first look.
      </p>
    </main>
  );
}
