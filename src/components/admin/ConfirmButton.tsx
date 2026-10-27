"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Modal } from "./Modal";
import { ui } from "./styles";

type Result = { ok: true } | { ok: false; error: string };

/**
 * A button that asks for confirmation before running a (server) action.
 * Shows a toast with the result.
 */
export function ConfirmButton({
  action,
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  successMessage = "Deleted",
  onDone,
  className,
  children,
  ariaLabel,
  destructive = true,
}: {
  action: () => Promise<Result>;
  title?: string;
  message: ReactNode;
  confirmLabel?: string;
  successMessage?: string;
  onDone?: () => void;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
  destructive?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const run = () => {
    startTransition(async () => {
      const res = await action();
      if (res.ok) {
        toast.success(successMessage);
        setOpen(false);
        onDone?.();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)} aria-label={ariaLabel}>
        {children}
      </button>
      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title={title}
        size="sm"
        footer={
          <>
            <button type="button" className={ui.btnGhost} onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </button>
            <button
              type="button"
              onClick={run}
              disabled={pending}
              className={destructive ? ui.btnDanger : ui.btn}
            >
              {pending ? "Working…" : confirmLabel}
            </button>
          </>
        }
      >
        <div className="text-sm leading-relaxed text-ink/80">{message}</div>
      </Modal>
    </>
  );
}
