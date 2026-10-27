import Link from "next/link";
import { BRAND, whatsappLink } from "@/lib/brand";
import { Logo } from "./Logo";

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
    title: "Order support",
    links: [
      { href: "/track", label: "Track your order" },
      { href: "/account", label: "My account" },
      { href: "/about#sizing", label: "Size guide" },
      { href: "/about#delivery", label: "Delivery & returns" },
    ],
  },
];

/** A raised white panel of link columns with the wordmark on the right. */
export function Footer() {
  return (
    <footer className="px-1.5 pb-1.5 pt-2 sm:px-[22px] sm:pb-[22px]">
      <div className="panel px-5 pt-10 sm:px-10 sm:pt-12">
        <div className="grid gap-10 lg:grid-cols-[3fr_1.2fr]">
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-[15px] font-medium tracking-tight">{col.title}</h3>
                <ul className="mt-5 space-y-3 text-[13px] text-ink/75">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="transition-colors hover:text-rose">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="col-span-2 sm:col-span-1">
              <h3 className="text-[15px] font-medium tracking-tight">Connect with us</h3>
              <ul className="mt-5 space-y-3 text-[13px] text-ink/75">
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
                <li className="text-ink/50">Abaya home service across the UAE</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col gap-4 lg:items-end lg:text-right">
            <Logo className="h-7 sm:h-8" />
            <p className="font-serif text-lg italic text-ink/70">{BRAND.tagline}.</p>
            <p className="max-w-xs text-xs leading-relaxed text-ink/55">Luxury abayas, made in the UAE and delivered in the signature Devon box.</p>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-1.5 border-t border-ink/10 py-6 text-center text-[11px] text-ink/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Devon Collection. All rights reserved.</p>
          <p>
            Licensed by the DED · <span lang="ar" dir="rtl">مرخصين من الدائرة الاقتصادية</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
