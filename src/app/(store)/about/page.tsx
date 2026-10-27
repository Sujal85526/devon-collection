import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/store/PageHero";
import { Reveal } from "@/components/store/Reveal";
import { BRAND, whatsappLink } from "@/lib/brand";
import { getStoreSettings } from "@/lib/catalog";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Our story",
  description: "Devon Collection — luxury abayas from the UAE, finished by hand and delivered in the signature Devon box.",
};

const SIZES = [
  ["52", "150–155 cm", "4′11″–5′1″"],
  ["54", "155–160 cm", "5′1″–5′3″"],
  ["56", "160–165 cm", "5′3″–5′5″"],
  ["58", "165–170 cm", "5′5″–5′7″"],
  ["60", "170 cm +", "5′7″ +"],
];

export default async function AboutPage() {
  const settings = await getStoreSettings();

  return (
    <>
      <PageHero
        eyebrow="Our story"
        title="Luxury in each detail"
        subtitle="Devon Collection began with a simple idea: the abaya you wear every day deserves the same care as the one you save for Eid."
        image="/images/noor-embroidered.jpg"
        alt="Model in the Noor embroidered abaya"
        focus="center 30%"
      />

      <section className="mx-auto max-w-3xl px-6 py-20 text-center md:py-28">
        <Reveal>
          <p className="font-serif text-[clamp(22px,2.4vw,32px)] leading-[1.45]">
            Each piece is designed in the UAE and finished by hand — embroidery stitched thread by thread, crystals set one at a time, lengths cut to
            fit. We keep our collections small so <span className="italic">every abaya gets our full attention</span>.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-5 px-5 md:grid-cols-3 md:px-10">
        {["/images/layal-detail.jpg", "/images/rack.jpg", "/images/lulu-ivory-lace.jpg"].map((src, i) => (
          <Reveal key={src} delay={i * 0.08} className="relative aspect-[3/4] overflow-hidden bg-paper-light">
            <Image src={src} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
          </Reveal>
        ))}
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-16 px-5 py-24 md:grid-cols-2 md:gap-20 md:px-10 md:py-32">
        <div id="sizing" className="scroll-mt-32">
          <p className="eyebrow text-rose">Size guide</p>
          <h2 className="mt-4 font-script text-4xl leading-none md:text-5xl">Choosing your length</h2>
          <p className="mt-5 max-w-md text-[14px] leading-[1.9] text-muted">
            Our abayas are sized by length in inches, from the top of the shoulder to the hem. Every style is cut loose, so choose by height. Need
            something in between? We adjust lengths for free.
          </p>
          <table className="mt-8 w-full max-w-md text-left text-sm">
            <thead>
              <tr className="border-b border-ink text-[10.5px] uppercase tracking-[0.2em]">
                <th className="py-3 font-semibold">Length</th>
                <th className="py-3 font-semibold">Your height</th>
                <th className="py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {SIZES.map(([size, cm, ft]) => (
                <tr key={size} className="border-b border-line">
                  <td className="py-3 font-serif text-lg">{size}</td>
                  <td className="py-3">{cm}</td>
                  <td className="py-3 text-muted">{ft}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-14">
          <div id="delivery" className="scroll-mt-32">
            <p className="eyebrow text-rose">Delivery &amp; exchanges</p>
            <ul className="mt-5 space-y-3 text-[14px] leading-relaxed text-ink/85">
              <li>Delivery across all seven Emirates in 1–3 working days, in the Devon gift box.</li>
              <li>
                {formatPrice(settings.shipping_flat)} delivery, free on orders over {formatPrice(settings.free_shipping_threshold)}.
              </li>
              <li>Pay by cash or card when your order arrives.</li>
              <li>Unworn pieces with tags can be exchanged within 7 days.</li>
            </ul>
          </div>
          <div id="home-service" className="scroll-mt-32">
            <p className="eyebrow text-rose">Abaya home service</p>
            <p className="mt-5 text-[14px] leading-relaxed text-ink/85">
              Prefer to try before you buy? Our stylist brings a curated rail to your home, in your size and favourite colours.
            </p>
            <a href={whatsappLink("Hello Devon Collection, I would like to book an abaya home service visit.")} target="_blank" rel="noopener noreferrer" className="btn-primary mt-6">
              Book a visit
            </a>
          </div>
          <div id="contact" className="scroll-mt-32">
            <p className="eyebrow text-rose">Say hello</p>
            <p className="mt-5 text-[14px] leading-relaxed text-ink/85">Questions about an order, sizing or a custom piece? We reply fastest on WhatsApp.</p>
            <div className="mt-4 flex flex-col gap-1 font-serif text-xl italic">
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="hover:text-rose">
                {BRAND.phoneDisplay}
              </a>
              <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-rose">
                {BRAND.instagramHandle}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ink px-6 py-20 text-center text-paper md:py-24">
        <Image src="/brand/logo-pink.png" alt="Devon Collection" width={960} height={220} className="mx-auto h-12 w-auto md:h-16" />
        <Link href="/shop" className="btn mt-10 border border-paper/70 text-paper hover:border-rose hover:bg-rose">
          Shop the collection
        </Link>
      </section>
    </>
  );
}
