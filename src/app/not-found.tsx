import Link from "next/link";
import { Footer } from "@/components/store/Footer";
import { Header } from "@/components/store/Header";

export default function NotFound() {
  return (
    <>
      <Header />
      <section className="flex min-h-[70svh] flex-col items-center justify-center px-6 py-24 text-center">
        <p className="eyebrow text-muted">404</p>
        <h1 className="mt-4 font-script text-[clamp(52px,7vw,96px)] leading-none">Page not found</h1>
        <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-muted">The page you&apos;re looking for has moved or no longer exists.</p>
        <Link href="/shop" className="btn-primary mt-10">
          Shop the collection
        </Link>
      </section>
      <Footer />
    </>
  );
}
