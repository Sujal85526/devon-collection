import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Accordion } from "@/components/store/Accordion";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductGallery } from "@/components/store/ProductGallery";
import { ProductPurchase } from "@/components/store/ProductPurchase";
import { Reveal } from "@/components/store/Reveal";
import { ReviewForm } from "@/components/store/ReviewForm";
import { Stars } from "@/components/store/Stars";
import { whatsappLink } from "@/lib/brand";
import { getApprovedReviews, getProduct, getProducts, getStoreSettings } from "@/lib/catalog";
import { formatDate, formatPrice } from "@/lib/utils";

export const revalidate = 120;

export async function generateMetadata(props: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description?.slice(0, 160),
    openGraph: { images: product.images[0] ? [product.images[0]] : undefined },
  };
}

export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  const { slug } = await props.params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [reviews, related, settings] = await Promise.all([
    getApprovedReviews(product.id),
    product.category ? getProducts({ categorySlug: product.category.slug, limit: 5 }) : getProducts({ limit: 5 }),
    getStoreSettings(),
  ]);
  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const onSale = product.compare_at_price && Number(product.compare_at_price) > Number(product.price);
  const others = related.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <>
      <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-6 md:px-10 md:pt-10">
        <nav className="mb-8 text-[10px] uppercase tracking-[0.04em] text-muted">
          <Link href="/shop" className="hover:text-ink">Shop</Link>
          {product.category && (
            <>
              <span className="mx-2">/</span>
              <Link href={`/collections/${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link>
            </>
          )}
        </nav>

        <div className="grid gap-10 md:grid-cols-[1.25fr_1fr] lg:gap-20">
          <Reveal y={16}>
            <ProductGallery images={product.images} name={product.name} />
          </Reveal>

          <Reveal y={16} delay={0.1} className="md:sticky md:top-28 md:self-start">
            {product.category && <p className="eyebrow text-rose">{product.category.name}</p>}
            <h1 className="mt-3 font-serif text-[clamp(32px,3.4vw,48px)] leading-[1.08]">{product.name}</h1>
            <div className="mt-4 flex items-center gap-4">
              <p className="text-lg tracking-wide">
                {formatPrice(product.price)}
                {onSale && <span className="ml-3 text-base text-muted line-through">{formatPrice(product.compare_at_price)}</span>}
              </p>
              {reviews.length > 0 && (
                <a href="#reviews" className="flex items-center gap-2 text-xs text-muted hover:text-ink">
                  <Stars rating={average} /> ({reviews.length})
                </a>
              )}
            </div>
            {product.description && <p className="mt-6 max-w-md text-[15px] leading-[1.9] text-ink/80">{product.description}</p>}

            <div className="mt-8">
              <ProductPurchase product={product} />
            </div>

            <p className="mt-5 text-xs text-muted">
              Free UAE delivery on orders over {formatPrice(settings.free_shipping_threshold)} · Cash or card on delivery
            </p>
            <a
              href={whatsappLink(`Hello Devon Collection, I have a question about the ${product.name}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs text-ink underline decoration-rose underline-offset-4 hover:text-rose"
            >
              Need a custom length or a home try-on? Message us on WhatsApp
            </a>

            <div className="mt-10">
              <Accordion
                items={[
                  ...(product.details ? [{ title: "Fabric & care", content: <p className="whitespace-pre-line">{product.details}</p> }] : []),
                  {
                    title: "Size guide",
                    content: (
                      <p>
                        Abayas are sized by length in inches, measured from the top of the shoulder to the hem. As a guide: 52 for
                        150–155 cm, 54 for 155–160 cm, 56 for 160–165 cm, 58 for 165–170 cm and 60 for 170 cm and taller. Every
                        style is cut loose, so choose by height rather than width.
                      </p>
                    ),
                  },
                  {
                    title: "Delivery & exchanges",
                    content: (
                      <p>
                        Delivered across the UAE in 1–3 working days, in the Devon gift box ({formatPrice(settings.shipping_flat)}, free over{" "}
                        {formatPrice(settings.free_shipping_threshold)}). Unworn pieces with tags can be exchanged within 7 days.
                      </p>
                    ),
                  },
                ]}
              />
            </div>
          </Reveal>
        </div>
      </div>

      <section id="reviews" className="bg-paper-light">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-14 md:grid-cols-[1fr_1.2fr] md:gap-14 md:px-10 md:py-24">
          <div>
            <h2 className="font-script text-5xl leading-none md:text-6xl">What people say</h2>
            {reviews.length > 0 ? (
              <div className="mt-6 flex items-center gap-3">
                <span className="font-serif text-5xl">{average.toFixed(1)}</span>
                <div>
                  <Stars rating={average} />
                  <p className="mt-1 text-xs text-muted">Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}</p>
                </div>
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted">No reviews yet. Be the first to share yours.</p>
            )}
            <ul className="mt-10 space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-2xl bg-paper p-6">
                  <div className="flex items-center justify-between">
                    <Stars rating={r.rating} />
                    <span className="text-[11px] text-muted">{formatDate(r.created_at)}</span>
                  </div>
                  {r.title && <p className="mt-3 font-medium">{r.title}</p>}
                  {r.body && <p className="mt-2 text-sm leading-relaxed text-ink/80">{r.body}</p>}
                  <p className="mt-3 text-[11px] uppercase tracking-[0.04em] text-muted">{r.author_name}</p>
                  {r.admin_reply && (
                    <div className="mt-4 border-l-2 border-rose pl-4 text-sm text-ink/80">
                      <p className="eyebrow mb-1 text-[10px] text-rose">Devon Collection</p>
                      {r.admin_reply}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="h-fit rounded-2xl bg-paper p-6 md:p-8">
            <h3 className="font-serif text-2xl">Write a review</h3>
            <p className="mb-6 mt-1 text-sm text-muted">Tell us how it fits and feels.</p>
            <ReviewForm productId={product.id} />
          </div>
        </div>
      </section>

      {others.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-5 py-14 md:px-10 md:py-24">
          <h2 className="mb-10 font-script text-4xl leading-none md:text-5xl">You may also like</h2>
          <div className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 no-scrollbar md:mx-0 md:grid md:grid-cols-4 md:gap-x-5 md:overflow-visible md:px-0 md:pb-0">
            {others.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.08} className="w-[68vw] shrink-0 snap-start md:w-auto">
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
