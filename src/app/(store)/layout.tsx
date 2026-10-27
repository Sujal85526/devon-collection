import type { Metadata } from "next";
import { CartDrawer } from "@/components/store/CartDrawer";
import { ComingSoon } from "@/components/store/ComingSoon";
import { Footer } from "@/components/store/Footer";
import { Header } from "@/components/store/Header";
import { Loader } from "@/components/store/Loader";
import { getStoreSettings } from "@/lib/catalog";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  return settings.store_open ? {} : { robots: { index: false, follow: false } };
}

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const settings = await getStoreSettings();
  // Switched off in the admin: every storefront page shows the "back soon" page instead.
  if (!settings.store_open) return <div className="theme-dark"><ComingSoon /></div>;
  return (
    <div className="theme-dark min-h-dvh">
      <Loader />
      <Header />
      <main>{children}</main>
      <Footer />
      <CartDrawer freeShippingThreshold={settings.free_shipping_threshold} />
    </div>
  );
}
