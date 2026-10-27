"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * Plain intro: a white page with the wordmark. Server-rendered, so it covers the page from the very
 * first paint; once the page has loaded (and the logo has been up for a moment) it fades out and
 * unmounts.
 */
export function Loader() {
  const [phase, setPhase] = useState<"show" | "fade" | "gone">("show");

  useEffect(() => {
    const started = performance.now();
    let hide: ReturnType<typeof setTimeout>;
    const done = () => {
      const wait = Math.max(0, 900 - (performance.now() - started));
      hide = setTimeout(() => setPhase("fade"), wait);
    };
    if (document.readyState === "complete") done();
    else window.addEventListener("load", done, { once: true });
    // Never hold the site back for slow assets.
    const cap = setTimeout(() => setPhase((p) => (p === "show" ? "fade" : p)), 3500);
    return () => {
      window.removeEventListener("load", done);
      clearTimeout(hide);
      clearTimeout(cap);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden
      onTransitionEnd={() => phase === "fade" && setPhase("gone")}
      className={`fixed inset-0 z-[100] grid place-items-center bg-white transition-opacity duration-700 ease-out ${phase === "fade" ? "pointer-events-none opacity-0" : "opacity-100"}`}
    >
      <Image src="/brand/logo-black.png" alt="" width={960} height={220} priority className="h-10 w-auto sm:h-12" />
    </div>
  );
}
