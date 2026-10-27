"use client";

import { useEffect, useRef, type HTMLAttributes } from "react";

/**
 * Fades and lifts its children in when scrolled into view. One shared IntersectionObserver marks
 * elements `data-revealed`; the motion itself is CSS (globals.css "Reveal on scroll"). Elements
 * already on screen at mount are left alone, so nothing pops or flashes on load.
 */

let observer: IntersectionObserver | null = null;

function getObserver() {
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute("data-revealed", "");
        observer?.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  return observer;
}

type RevealProps = HTMLAttributes<HTMLDivElement> & { delay?: number; y?: number };

export function Reveal({ delay = 0, y = 24, style, children, ...rest }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return; // already visible
    el.dataset.reveal = "ready";
    const io = getObserver();
    io.observe(el);
    return () => io.unobserve(el);
  }, []);

  return (
    <div
      ref={ref}
      {...rest}
      style={{ ...style, ["--reveal-delay" as string]: `${Math.round(delay * 1000)}ms`, ["--reveal-y" as string]: `${y}px` }}
    >
      {children}
    </div>
  );
}
