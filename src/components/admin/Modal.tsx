"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink-deep/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          "relative flex max-h-[94dvh] w-full flex-col bg-white shadow-2xl sm:max-h-[92vh]",
          size === "sm" && "sm:max-w-md",
          size === "md" && "sm:max-w-xl",
          size === "lg" && "sm:max-w-3xl",
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-ink/10 py-3 pl-4 pr-2 sm:px-6 sm:py-4">
          <h2 className="min-w-0 truncate font-serif text-xl text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 flex h-10 w-10 shrink-0 items-center justify-center text-ink/50 hover:text-ink sm:mr-0 sm:h-auto sm:w-auto sm:p-1"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex shrink-0 justify-end gap-3 border-t border-ink/10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 max-sm:[&>*]:flex-1 sm:px-6 sm:pb-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
