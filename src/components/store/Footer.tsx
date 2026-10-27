import Image from "next/image";
import Link from "next/link";
import { BRAND, whatsappLink } from "@/lib/brand";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All abayas" },
      { href: "/collections/signature-black", label: "Signature Black" },
      { href: "/collections/satin", label: "Satin Open Abayas" },
      { href: "/collections/occasion", label: "Occasion" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/track", label: "Track your order" },
      { href: "/account", label: "My account" },
      { href: "/about#sizing", label: "Size guide" },
      { href: "/about#delivery", label: "Delivery & returns" },
    ],
  },
];

/** Black, like the Devon box — fuchsia wordmark and quiet ivory type. */
export function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-x-6 gap-y-10 px-6 pb-10 pt-14 md:grid-cols-[1.5fr_1fr_1fr_1.2fr] md:gap-12 md:px-10 md:py-20">
        <div className="col-span-2 md:col-span-1">
          <Image src="/brand/logo-pink.png" alt="Devon Collection" width={960} height={220} className="h-10 w-auto md:h-12" />
          <p className="mt-6 max-w-xs font-serif text-lg italic text-paper/80">{BRAND.tagline}.</p>
          <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-paper/50">Luxury abayas, made in the UAE and delivered in the signature Devon box.</p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="eyebrow text-paper/45">{col.title}</h3>
            <ul className="mt-4 space-y-1 md:mt-6 md:space-y-3">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="inline-block py-1 text-[13px] text-paper/85 transition-colors hover:text-rose md:py-0">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="col-span-2 md:col-span-1">
          <h3 className="eyebrow text-paper/45">Say hello</h3>
          <ul className="mt-4 space-y-2 text-[13px] text-paper/85 md:mt-6 md:space-y-3">
            <li>
              <a href={whatsappLink("Hello Devon Collection")} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-rose">
                WhatsApp {BRAND.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-rose">
                Instagram {BRAND.instagramHandle}
              </a>
            </li>
            <li className="text-paper/50">Abaya home service across the UAE</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-paper/10">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-2 px-6 py-6 text-[11px] uppercase tracking-[0.2em] text-paper/40 md:flex-row md:px-10">
          <p>© {new Date().getFullYear()} Devon Collection</p>
          <p>
            Licensed by the DED · <span lang="ar" dir="rtl" className="text-[12px] normal-case tracking-normal">مرخصين من الدائرة الاقتصادية</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
