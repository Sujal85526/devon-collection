"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Pencil, Trash } from "lucide-react";
import { toast } from "sonner";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { ui } from "@/components/admin/styles";
import { cn } from "@/lib/utils";
import { deleteProduct, duplicateProduct, setProductFlag } from "./actions";

export function ProductFlagToggle({
  id,
  flag,
  value,
  named = false,
}: {
  id: string;
  flag: "is_active" | "is_featured";
  value: boolean;
  /** Always name the flag (used on mobile cards where there is no column header). */
  named?: boolean;
}) {
  const [optimistic, setOptimistic] = useOptimistic(value);
  const [pending, startTransition] = useTransition();
  const label = flag === "is_active" ? (optimistic ? "Active" : "Draft") : optimistic || named ? "Best seller" : "—";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={optimistic}
      aria-label={flag === "is_active" ? "Active" : "Best seller"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          const res = await setProductFlag(id, flag, !optimistic);
          if (!res.ok) toast.error(res.error);
        })
      }
      className="flex items-center gap-2 max-md:min-h-10"
    >
      <span
        className={cn(
          "relative inline-flex h-4 w-7 items-center rounded-full transition-colors",
          optimistic ? "bg-rose" : "bg-ink/20",
        )}
      >
        <span
          className={cn(
            "inline-block h-3 w-3 rounded-full bg-white shadow transition-transform",
            optimistic ? "translate-x-3.5" : "translate-x-0.5",
          )}
        />
      </span>
      <span className="text-xs text-muted">{label}</span>
    </button>
  );
}

export function ProductRowActions({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={`/admin/products/${id}`} className={ui.iconBtn} aria-label={`Edit ${name}`} title="Edit">
        <Pencil size={15} />
      </Link>
      <button
        type="button"
        className={ui.iconBtn}
        title="Duplicate"
        aria-label={`Duplicate ${name}`}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await duplicateProduct(id);
            if (res.ok) {
              toast.success("Product duplicated as a draft");
              router.push(`/admin/products/${res.data.id}`);
            } else toast.error(res.error);
          })
        }
      >
        <Copy size={15} />
      </button>
      <ConfirmButton
        className={ui.iconBtnDanger}
        ariaLabel={`Delete ${name}`}
        title="Delete product?"
        message={
          <>
            <strong>{name}</strong> and all its variants and reviews will be permanently deleted. Past orders keep
            their line items.
          </>
        }
        action={() => deleteProduct(id)}
        successMessage="Product deleted"
      >
        <Trash size={15} />
      </ConfirmButton>
    </div>
  );
}
