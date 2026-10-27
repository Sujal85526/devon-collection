import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Gift, Home, Ruler, Truck } from "lucide-react";
import { CollectionCarousel } from "@/components/store/CollectionCarousel";
import { ProductCard } from "@/components/store/ProductCard";
import { SectionHead } from "@/components/store/SectionHead";
import { Reveal } from "@/components/store/Reveal";
import { BRAND, whatsappLink } from "@/lib/brand";
import { getCategories, getProducts } from "@/lib/catalog";

export const revalidate = 300;

// Shown before the catalogue is seeded, or if a collection has no image yet.
const FALLBACK_COLLECTIONS = [
  { slug: "signature-black", name: "Signature Black", tagline: "The black abaya, perfected.", image_url: "/images/sahar-classic.jpg" },
  { slug: "satin", name: "Satin Open Abayas", tagline: "Fluid satin in colour.", image_url: "/images/rack.jpg" },
  { slug: "occasion", name: "Occasion", tagline: "For Eid, weddings and evenings.", image_url: "/images/layal-beaded.jpg" },
];

const SERVICES = [
  { icon: Home, title: "Abaya home service", body: "We bring the collection to you. Try on at home anywhere in the UAE." },
  { icon: Ruler, title: "Your length", body: "Every style in 52 to 60 inches, with free length adjustments." },
  { icon: Truck, title: "UAE delivery", body: "Delivered in 1–3 days. Free on orders over AED 500." },
  { icon: Gift, title: "The Devon box", body: "Wrapped in black and tied with our fuchsia satin ribbon." },
];

const HOUSE = [
  { title: "Our story", text: "Abayas made to be worn and remembered: cut in the UAE, finished by hand, and delivered in our signature black box.", href: "/about", cta: "Read our story", image: "/images/sahar-classic.jpg" },
  { title: "The Devon box", text: "Folded in fuchsia tissue, laid in black and tied with satin ribbon, or delivered on a hanger in a Devon garment cover.", href: "/shop", cta: "Find a gift", image: "/images/packaging.jpg" },
  { title: "Delivery & sizing", text: "Every style in 52 to 60 inches. Delivered across the UAE in 1–3 days, free over AED 500.", href: "/about#delivery", cta: "Size guide", image: "/images/layal-beaded.jpg" },
];

const GALLERY = ["/images/layal-detail.jpg", "/images/satin-fuchsia.jpg", "/images/lulu-ivory-lace.jpg", "/images/sahar-classic.jpg"];

export default async function HomePage() {
  const [categories, featured] = await Promise.all([getCategories(), getProducts({ featured: true, limit: 4 })]);
  const arrivals = featured.length ? featured : await getProducts({ limit: 4 });
  const featuredCollections = categories.filter((c) => c.is_featured).slice(0, 3);
  const collections = featuredCollections.length ? featuredCollections : FALLBACK_COLLECTIONS;

  return (
    <>
      {/* Hero: two campaign photos side by side, the header floats over them. */}
      <section data-hero className="relative h-[85svh] min-h-[560px] overflow-hidden bg-ink text-white lg:h-[100svh]">
        <div className="absolute inset-0 grid md:grid-cols-2">
          <video
            className="h-full w-full object-cover"
            src="/video/hero-1.mp4"
            poster="/video/hero-1-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-label="Model in the Layal beaded abaya"
          />
          <video
            className="hidden h-full w-full object-cover md:block"
            src="/video/hero-2.mp4"
            poster="/video/hero-2-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="Model in the Sahar classic abaya"
          />
        </div>
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink/85 via-ink/45 to-transparent" />
        <div className="hero-rise absolute inset-x-0 bottom-[9%] flex flex-col items-center px-6 text-center">
          <p className="mb-3 font-serif text-[clamp(1.8rem,3.4vw,2.8rem)] italic leading-none">Luxury in each detail</p>
          <Link href="/shop" className="border-b border-white/80 pb-1 text-[15px] font-medium transition-colors hover:border-transparent">
            Shop now
          </Link>
        </div>
      </section>

      {/* New arrivals */}
      {arrivals.length > 0 && (
        <section className="px-1.5 py-6 sm:px-[22px] sm:py-8">
          <div className="px-1.5 sm:px-0">
            <SectionHead title="New arrivals" href="/shop" />
          </div>
          <div className="grid grid-cols-2 gap-x-1.5 gap-y-5 lg:grid-cols-4">
            {arrivals.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 2} />
            ))}
          </div>
        </section>
      )}

      {/* Collections */}
      <CollectionCarousel
        slides={[
          ...collections.map((c) => ({ title: c.name, href: `/collections/${c.slug}`, image: c.image_url ?? "/images/rack.jpg" })),
          { title: "The Devon box", href: "/shop", image: "/images/packaging.jpg" },
        ]}
      />

      {/* The house */}
      <section className="px-1.5 py-6 sm:px-[22px] sm:py-8">
        <div className="px-1.5 sm:px-0">
          <SectionHead title="The house" />
        </div>
        <Reveal className="grid gap-2 md:grid-cols-3 md:gap-3.5">
          {HOUSE.map((h) => (
            <article key={h.title} className="panel p-2.5">
              <Link href={h.href} className="group relative block aspect-[4/5] overflow-hidden rounded-[12px] bg-ink md:aspect-[6/7]">
                <Image src={h.image} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
              </Link>
              <div className="grid gap-2 px-2 pb-2 pt-4 sm:grid-cols-[1fr_1.4fr] sm:gap-4">
                <div>
                  <h3 className="text-[15px] font-medium tracking-tight">{h.title}</h3>
                  <Link href={h.href} className="mt-3 inline-flex items-center gap-1 border-b border-ink text-xs">
                    {h.cta} <ArrowUpRight className="size-3" />
                  </Link>
                </div>
                <p className="text-xs leading-relaxed text-ink/65">{h.text}</p>
              </div>
            </article>
          ))}
        </Reveal>
      </section>

      {/* Services */}
      <section className="px-1.5 py-2 sm:px-[22px]">
        <div className="panel grid grid-cols-2 gap-x-6 gap-y-8 px-5 py-8 md:grid-cols-4 md:px-8">
          {SERVICES.map((s) => (
            <div key={s.title}>
              <s.icon className="size-5 text-rose" strokeWidth={1.3} />
              <h3 className="mt-3 text-[13px] font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-1.5 max-w-[16rem] text-xs leading-relaxed text-ink/60">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Home service */}
      <section className="px-1.5 py-6 sm:px-[22px] sm:py-8">
        <div className="panel flex flex-col items-start gap-6 px-5 py-8 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="max-w-xl">
            <p lang="ar" dir="rtl" className="text-sm text-ink/50">خدمة منزلية للعبايات</p>
            <h2 className="font-script mt-2 text-[clamp(28px,3.4vw,44px)] leading-[1.05]">
              Try the collection <em>at home</em>
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-ink/60">
              Book a home visit and our stylist brings a curated rail to you, in your size and favourite colours.
            </p>
          </div>
          <a
            href={whatsappLink("Hello Devon Collection, I would like to book an abaya home service visit.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary shrink-0"
          >
            Book on WhatsApp
          </a>
        </div>
      </section>

      {/* Instagram */}
      <section className="px-1.5 pb-4 pt-2 sm:px-[22px]">
        <div className="px-1.5 sm:px-0">
          <SectionHead title={BRAND.instagramHandle} href={BRAND.instagram} label="Follow" />
        </div>
        <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
          {GALLERY.map((src) => (
            <a key={src} href={BRAND.instagram} target="_blank" rel="noopener noreferrer" className="group relative aspect-square overflow-hidden rounded-[10px]" aria-label="Devon Collection on Instagram">
              <Image src={src} alt="" fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
