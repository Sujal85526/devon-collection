import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";

// Playfair Display is the closest open match to the high-contrast serif of the Devon wordmark;
// Montserrat carries the UI. Both self-hosted from src/fonts (Latin WOFF2 subsets).
const playfair = localFont({
  variable: "--font-playfair",
  display: "swap",
  src: [
    { path: "../fonts/web/PlayfairDisplay-Variable.woff2", weight: "400 900", style: "normal" },
    { path: "../fonts/web/PlayfairDisplay-Italic-Variable.woff2", weight: "400 900", style: "italic" },
  ],
});
const montserrat = localFont({
  variable: "--font-montserrat",
  display: "swap",
  src: [
    { path: "../fonts/web/Montserrat-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/web/Montserrat-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/web/Montserrat-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../fonts/web/Montserrat-Bold.woff2", weight: "700", style: "normal" },
  ],
});

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
    <html lang="en" className={`${playfair.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <body className="min-h-screen">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: { background: "#111010", color: "#faf7f4", border: "none", borderRadius: 0, fontFamily: "var(--font-montserrat)" },
          }}
        />
      </body>
    </html>
  );
}
