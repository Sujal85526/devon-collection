import Link from "next/link";
import { cn } from "@/lib/utils";

/** Section heading row: a small bold title on the left and a "Discover more" pill on the right. */
export function SectionHead({ title, href, label = "Discover more", dark }: { title: string; href?: string; label?: string; dark?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 pb-3.5">
      <h2 className="text-[15px] font-semibold tracking-tight sm:text-base">{title}</h2>
      {href && (
        <Link
          href={href}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-medium transition-colors hover:bg-rose hover:text-white",
            dark ? "bg-ink text-paper" : "bg-paper",
          )}
        >
          {label}
        </Link>
      )}
    </div>
  );
}
