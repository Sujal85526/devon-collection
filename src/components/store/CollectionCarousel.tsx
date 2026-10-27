"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type Slide = { title: string; href: string; image: string };

/** Wide collection slides that drift on by themselves, with pill dots. */
export function CollectionCarousel({ slides }: { slides: Slide[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const paused = useRef(false);

  const goTo = (i: number) => {
    const el = rail.current;
    const slide = el?.children[i] as HTMLElement | undefined;
    if (!el || !slide) return;
    el.scrollTo({ left: slide.offsetLeft - (el.clientWidth - slide.clientWidth) / 2, behavior: "smooth" });
  };

  useEffect(() => {
    const id = setInterval(() => {
      if (!paused.current) goTo((active + 1) % slides.length);
    }, 5000);
    return () => clearInterval(id);
  }, [active, slides.length]);

  const onScroll = () => {
    const el = rail.current;
    if (!el) return;
    const centre = el.scrollLeft + el.clientWidth / 2;
    const mid = (c: Element) => (c as HTMLElement).offsetLeft + (c as HTMLElement).clientWidth / 2;
    let best = 0;
    Array.from(el.children).forEach((c, i) => {
      if (Math.abs(mid(c) - centre) < Math.abs(mid(el.children[best]) - centre)) best = i;
    });
    setActive(best);
  };

  return (
    <section className="relative py-6 sm:py-8" onMouseEnter={() => (paused.current = true)} onMouseLeave={() => (paused.current = false)}>
      <div ref={rail} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
        {slides.map((s, i) => (
          <Link
            key={s.title}
            href={s.href}
            className="relative h-[62svh] max-h-[560px] min-h-[380px] w-[86%] shrink-0 snap-center overflow-hidden bg-black first:ml-[7%] last:mr-[7%] sm:w-[60%] sm:first:ml-[20%] sm:last:mr-[20%]"
          >
            <Image src={s.image} alt="" fill loading={i < 2 ? "eager" : undefined} sizes="(min-width: 640px) 60vw, 86vw" className="object-cover" />
            <span className="absolute inset-0 bg-black/30" />
            <span className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center text-center text-white">
              <span className="text-[clamp(1.5rem,3.2vw,2.6rem)] font-medium uppercase leading-none tracking-[-0.035em]">{s.title}</span>
              <span className="mt-3 text-xs font-medium uppercase tracking-wide">Shop now</span>
            </span>
          </Link>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-10 flex justify-center gap-2 sm:bottom-12">
        {slides.map((s, i) => (
          <button
            key={s.title}
            type="button"
            aria-label={`Show ${s.title}`}
            onClick={() => goTo(i)}
            className={cn("h-2 rounded-full transition-all duration-300", i === active ? "w-8 bg-white" : "w-2 bg-white/50")}
          />
        ))}
      </div>
    </section>
  );
}
