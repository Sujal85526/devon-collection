import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** The Devon Collection wordmark, cut from the original artwork (public/brand/logo-*.png). */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="Devon Collection — home" className={cn("block shrink-0", className)}>
      <Image src="/brand/logo-black.png" alt="Devon Collection" width={960} height={220} priority className="logo-dark h-full w-auto" />
      <Image src="/brand/logo-white.png" alt="Devon Collection" width={960} height={220} priority className="logo-light h-full w-auto" />
    </Link>
  );
}
