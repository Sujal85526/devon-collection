import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

// Instrument Sans (medium, tight tracking) for everything; Instrument Serif italic for single accent words.
const sans = Instrument_Sans({ variable: "--font-instrument-sans", subsets: ["latin"], weight: ["400", "500", "600"] });
const serif = Instrument_Serif({ variable: "--font-instrument-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Devon Collection — Luxury in Each Detail",
    template: "%s · Devon Collection",
  },
  description:
    "Luxury abayas from the UAE. Embroidered, satin and occasion abayas, delivered across the Emirates with abaya home service.",
  openGraph: {
    title: "Devon Collection — Luxury in Each Detail",
    description: "Luxury abayas from the UAE, delivered in the signature Devon box.",
    siteName: "Devon Collection",
    type: "website",
    images: ["/images/packaging.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: { background: "#2a2828", color: "#ffffff", border: "none", borderRadius: 9999, fontFamily: "var(--font-instrument-sans)" },
          }}
        />
      </body>
    </html>
  );
}
