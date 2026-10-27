import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gift, Home, Ruler, Truck } from "lucide-react";
import { ProductCard } from "@/components/store/ProductCard";
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

const GALLERY = ["/images/layal-detail.jpg", "/images/satin-fuchsia.jpg", "/images/lulu-ivory-lace.jpg", "/images/sahar-classic.jpg"];

const arrow = <ArrowRight className="size-3.5" strokeWidth={1.4} />;

export default async function HomePage() {
  const [categories, featured] = await Promise.all([getCategories(), getProducts({ featured: true, limit: 4 })]);
  const arrivals = featured.length ? featured : await getProducts({ limit: 4 });
  const featuredCollections = categories.filter((c) => c.is_featured).slice(0, 3);
  const collections = featuredCollections.length ? featuredCollections : FALLBACK_COLLECTIONS;

  return (
    <>
      {/* Hero: two campaign photos side by side, the header floats over them. */}
      <section data-hero className="relative h-[92svh] min-h-[560px] overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 grid md:grid-cols-2">
          <div className="relative overflow-hidden">
            <Image
              src="/images/noor-embroidered.jpg"
              alt="Model in the Noor embroidered black abaya"
              fill
              priority
              quality={90}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="hero-zoom object-cover object-[center_30%]"
            />
          </div>
          <div className="relative hidden overflow-hidden md:block">
            <Image
              src="/images/rack.jpg"
              alt="Satin abayas in royal blue, fuchsia and sand on Devon hangers"
              fill
              priority
              quality={90}
              sizes="50vw"
              className="hero-zoom object-cover"
            />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/30" />
        <div className="relative flex h-full flex-col items-center justify-end px-6 pb-16 text-center md:pb-20">
          <p className="hero-rise eyebrow text-white/85">New season · Autumn 2026</p>
          <h1 className="mt-5 overflow-hidden pb-[0.14em] font-script text-[clamp(48px,7.5vw,112px)] leading-[0.95]">
            <span className="hero-line block" style={{ "--d": "0.1s" } as React.CSSProperties}>
              Luxury in each detail
            </span>
          </h1>
          <div className="hero-rise mt-9 flex w-full max-w-xs flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:justify-center" style={{ "--d": "0.45s" } as React.CSSProperties}>
            <Link href="/shop" className="btn bg-white text-ink hover:bg-rose hover:text-white">
              Shop the collection
            </Link>
            <Link href="/collections/occasion" className="btn-light">
              Occasion edit
            </Link>
          </div>
        </div>
      </section>

      {/* Statement */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center md:py-28">
        <Reveal>
          <p className="eyebrow text-rose">Devon Collection</p>
          <p className="mt-6 font-serif text-[clamp(24px,2.6vw,36px)] leading-[1.35]">
            Abayas made to be worn and remembered — cut in the UAE, <span className="italic">finished by hand</span>, and delivered in our signature
            black box.
          </p>
        </Reveal>
      </section>

      {/* Collections */}
      <section className="mx-auto max-w-[1440px] px-5 md:px-10">
        {/* Phones: a swipeable row; desktop: three columns. */}
        <div className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 no-scrollbar md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0">
          {collections.map((c, i) => (
            <Reveal key={c.slug} delay={i * 0.08} className="w-[78vw] shrink-0 snap-start md:w-auto">
              <Link href={`/collections/${c.slug}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden bg-paper-light">
                  {c.image_url && (
                    <Image
                      src={c.image_url}
                      alt={c.name}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover transition-transform duration-[1.4s] ease-out-soft group-hover:scale-[1.04]"
                    />
                  )}
                </div>
                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-xl md:text-2xl">{c.name}</h3>
                    {c.tagline && <p className="mt-1 text-[13px] text-muted">{c.tagline}</p>}
                  </div>
                  <span className="link-arrow shrink-0 pb-1 group-hover:gap-5 group-hover:text-rose">Shop {arrow}</span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* New arrivals */}
      {arrivals.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-5 pb-8 pt-24 md:px-10 md:pt-32">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow text-muted">Just in</p>
              <h2 className="mt-3 font-script text-[clamp(36px,4vw,56px)] leading-none">New arrivals</h2>
            </div>
            <Link href="/shop" className="link-arrow pb-1">
              View all {arrow}
            </Link>
          </div>
          <div className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 no-scrollbar md:mx-0 md:grid md:grid-cols-4 md:gap-x-5 md:overflow-visible md:px-0 md:pb-0">
            {arrivals.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.06} className="w-[68vw] shrink-0 snap-start md:w-auto">
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* The Devon box */}
      <section className="mt-24 grid bg-ink text-paper md:mt-32 md:grid-cols-2">
        <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[620px]">
          <Image
            src="/images/packaging.jpg"
            alt="Devon Collection black gift box, shopping bags and garment cover with fuchsia satin ribbons"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-center px-7 py-16 md:px-[9%]">
          <Reveal>
            <p className="eyebrow text-rose">The Devon box</p>
            <h2 className="mt-5 font-script text-[clamp(36px,4vw,60px)] leading-[1.05]">Wrapped like a gift, every time.</h2>
            <p className="mt-6 max-w-md text-[14px] leading-[1.9] text-paper/70">
              Each abaya is folded in fuchsia tissue, laid in our black box and tied with satin ribbon — or delivered on a hanger in a Devon garment cover.
              Ready to give, or to keep.
            </p>
            <Link href="/shop" className="btn mt-10 border border-paper/70 text-paper hover:border-rose hover:bg-rose">
              Find a gift
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Services */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-x-6 gap-y-10 px-5 py-16 md:grid-cols-4 md:px-10 md:py-20">
          {SERVICES.map((s) => (
            <div key={s.title} className="text-center md:px-4">
              <s.icon className="mx-auto size-6 text-rose" strokeWidth={1.2} />
              <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em]">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-[15rem] text-[13px] leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Home service CTA */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center md:py-28">
        <Reveal>
          <p lang="ar" dir="rtl" className="text-[15px] text-muted">خدمة منزلية للعبايات</p>
          <h2 className="mt-4 font-script text-[clamp(34px,4vw,56px)] leading-[1.05]">Try the collection at home</h2>
          <p className="mx-auto mt-5 max-w-md text-[14px] leading-[1.9] text-muted">
            Book a home visit and our stylist brings a curated rail to you, in your size and favourite colours.
          </p>
          <a
            href={whatsappLink("Hello Devon Collection, I would like to book an abaya home service visit.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-9"
          >
            Book on WhatsApp
          </a>
        </Reveal>
      </section>

      {/* Instagram */}
      <section className="pb-24">
        <div className="mb-8 text-center">
          <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer" className="font-serif text-2xl italic transition-colors hover:text-rose">
            {BRAND.instagramHandle}
          </a>
        </div>
        <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
          {GALLERY.map((src) => (
            <a key={src} href={BRAND.instagram} target="_blank" rel="noopener noreferrer" className="group relative aspect-square overflow-hidden" aria-label="Devon Collection on Instagram">
              <Image src={src} alt="" fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              <span className="absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/25" />
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
