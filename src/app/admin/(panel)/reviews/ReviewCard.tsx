"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Ban, Check, LoaderCircle, Reply, Trash } from "lucide-react";
import { toast } from "sonner";
import type { Review } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Badge, Card, Stars } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Thumb } from "@/components/admin/Thumb";
import { ui } from "@/components/admin/styles";
import { deleteReview, saveReviewReply, setReviewStatus } from "./actions";

export type ReviewRow = Review & { product: { id: string; name: string; slug: string; images: string[] } | null };

const statusTone = { pending: "alert", approved: "sage", rejected: "neutral" } as const;

export function ReviewCard({ review }: { review: ReviewRow }) {
  const [pending, startTransition] = useTransition();
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState(review.admin_reply ?? "");

  const changeStatus = (status: "approved" | "rejected" | "pending") =>
    startTransition(async () => {
      const res = await setReviewStatus(review.id, status);
      if (res.ok) toast.success(status === "approved" ? "Review approved" : status === "rejected" ? "Review rejected" : "Moved to pending");
      else toast.error(res.error);
    });

  const submitReply = () =>
    startTransition(async () => {
      const res = await saveReviewReply(review.id, reply);
      if (res.ok) {
        toast.success(reply.trim() ? "Reply saved" : "Reply removed");
        setReplying(false);
      } else toast.error(res.error);
    });

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex items-start gap-3 md:w-56 md:shrink-0">
          <Thumb src={review.product?.images?.[0]} alt={review.product?.name ?? ""} size={48} />
          <div className="min-w-0">
            {review.product ? (
              <Link href={`/admin/products/${review.product.id}`} className="block text-sm font-medium text-ink hover:underline">
                {review.product.name}
              </Link>
            ) : (
              <span className="text-sm text-muted">Deleted product</span>
            )}
            <p className="mt-1 text-xs text-muted">{formatDate(review.created_at, true)}</p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <Stars rating={review.rating} />
            <Badge tone={statusTone[review.status]}>{review.status}</Badge>
          </div>
          {review.title && <p className="mt-2 font-semibold text-ink">{review.title}</p>}
          {review.body && <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink/80">{review.body}</p>}
          <p className="mt-2 text-xs text-muted">
            — {review.author_name}
            {review.author_email && <span> · {review.author_email}</span>}
            {review.user_id && <span> · verified account</span>}
          </p>

          {review.admin_reply && !replying && (
            <div className="mt-3 border-l-2 border-rose bg-paper-light px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/60">Devon Collection replied</p>
              <p className="mt-1 whitespace-pre-line text-sm text-ink/80">{review.admin_reply}</p>
            </div>
          )}

          {replying && (
            <div className="mt-3">
              <textarea
                rows={3}
                autoFocus
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className={ui.input}
                placeholder="Thank you for the kind words…"
                aria-label="Reply"
              />
              <div className="mt-2 flex gap-2">
                <button type="button" className={ui.btnSmall} onClick={submitReply} disabled={pending}>
                  {pending ? <LoaderCircle size={12} className="animate-spin" /> : <Check size={12} />}
                  Save reply
                </button>
                <button
                  type="button"
                  className="px-2 text-[11px] text-ink/50 hover:text-ink"
                  onClick={() => {
                    setReply(review.admin_reply ?? "");
                    setReplying(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-start gap-2 md:w-40 md:flex-col md:items-stretch">
          {review.status !== "approved" && (
            <button type="button" className={ui.btnSmall} onClick={() => changeStatus("approved")} disabled={pending}>
              <Check size={12} className="text-[#4f6312]" /> Approve
            </button>
          )}
          {review.status !== "rejected" && (
            <button type="button" className={ui.btnSmall} onClick={() => changeStatus("rejected")} disabled={pending}>
              <Ban size={12} /> Reject
            </button>
          )}
          {!replying && (
            <button type="button" className={ui.btnSmall} onClick={() => setReplying(true)} disabled={pending}>
              <Reply size={12} /> {review.admin_reply ? "Edit reply" : "Reply"}
            </button>
          )}
          <ConfirmButton
            className={`${ui.btnSmall} hover:!border-red-300 hover:text-red-600`}
            title="Delete review?"
            message={`The review by ${review.author_name} will be permanently deleted.`}
            action={() => deleteReview(review.id)}
            successMessage="Review deleted"
          >
            <Trash size={12} /> Delete
          </ConfirmButton>
        </div>
      </div>
    </Card>
  );
}
