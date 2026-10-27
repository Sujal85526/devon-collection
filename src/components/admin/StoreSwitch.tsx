"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { setStoreOpen } from "@/app/admin/(panel)/store-actions";
import { cn } from "@/lib/utils";

/** Sidebar switch that takes the whole storefront offline (or back online). */
export function StoreSwitch({ open }: { open: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(open);
  const [pending, start] = useTransition();

  function toggle() {
    const next = !optimistic;
    if (!next && !confirm("Take the store offline? Visitors will see a “back soon” page and can't place orders.")) return;
    start(async () => {
      setOptimistic(next);
      const res = await setStoreOpen(next);
      if (res.ok) toast(next ? "Store is live" : "Store is offline");
      else toast.error(res.error);
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={optimistic}
      disabled={pending}
      onClick={toggle}
      className="flex w-full items-center justify-between gap-3 bg-paper/5 px-4 py-3 text-left transition-colors hover:bg-paper/10 disabled:opacity-60"
    >
      <span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-paper/50">Store</span>
        <span className={cn("mt-0.5 flex items-center gap-2 text-[13px] font-medium", optimistic ? "text-paper" : "text-alert")}>
          <span className={cn("size-2 rounded-full", optimistic ? "bg-rose" : "bg-alert")} />
          {optimistic ? "Live" : "Offline"}
        </span>
      </span>
      <span className={cn("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors", optimistic ? "bg-rose" : "bg-paper/25")}>
        <span className={cn("inline-block size-4 rounded-full bg-white shadow transition-transform", optimistic ? "translate-x-[18px]" : "translate-x-0.5")} />
      </span>
    </button>
  );
}
