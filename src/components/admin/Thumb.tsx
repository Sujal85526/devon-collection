import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small square product/category thumbnail with a placeholder when there is no image. */
export function Thumb({ src, alt, size = 44, className }: { src?: string | null; alt: string; size?: number; className?: string }) {
  return (
    <div
      className={cn("relative shrink-0 overflow-hidden bg-paper-light", className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes={`${size}px`} className="object-cover" unoptimized />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-ink/25">
          <ImageIcon width={size / 2.5} height={size / 2.5} aria-hidden />
        </div>
      )}
    </div>
  );
}
