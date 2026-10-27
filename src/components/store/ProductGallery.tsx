"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) {
    return (
      <div className="grid aspect-[3/4] place-items-center bg-paper-light">
        <Image src="/brand/logo-black.png" alt="" width={960} height={220} className="w-1/2 opacity-15" />
      </div>
    );
  }
  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {images.length > 1 && (
        <div className="no-scrollbar flex gap-3 overflow-x-auto md:w-20 md:flex-col">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              className={cn(
                "relative aspect-[3/4] w-16 shrink-0 overflow-hidden transition-opacity md:w-full",
                i === active ? "opacity-100 ring-1 ring-ink" : "opacity-55 hover:opacity-100",
              )}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="relative aspect-[3/4] flex-1 overflow-hidden bg-paper-light">
        <AnimatePresence initial={false}>
          <motion.div
            key={active}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image src={images[active]} alt={name} fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
