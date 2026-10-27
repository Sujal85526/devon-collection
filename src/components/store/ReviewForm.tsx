"use client";

import { Star } from "lucide-react";
import { useActionState, useState } from "react";
import { submitReview, type ReviewState } from "@/app/(store)/product/[slug]/actions";
import { cn } from "@/lib/utils";

export function ReviewForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(submitReview, null);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);

  if (state?.ok) {
    return <p className="border border-rose/40 bg-rose/10 p-5 text-sm">{state.message}</p>;
  }

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <div className="md:col-span-2">
        <span className="label">Your rating</span>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} aria-label={`${n} stars`} className="p-1.5 first:-ml-1.5">
              <Star className={cn("size-6 transition-colors", n <= (hover || rating) ? "fill-ink text-ink" : "text-ink/25")} strokeWidth={1.3} />
            </button>
          ))}
        </div>
      </div>
      <label>
        <span className="label">Name</span>
        <input name="name" required className="field" />
      </label>
      <label>
        <span className="label">Email (not published)</span>
        <input name="email" type="email" className="field" />
      </label>
      <label className="md:col-span-2">
        <span className="label">Title</span>
        <input name="title" className="field" placeholder="Perfect for boat days" />
      </label>
      <label className="md:col-span-2">
        <span className="label">Review</span>
        <textarea name="body" required rows={4} className="field resize-none" />
      </label>
      {state && !state.ok && <p className="text-sm text-alert md:col-span-2">{state.message}</p>}
      <div className="md:col-span-2">
        <button disabled={pending} className="btn-primary">
          {pending ? "Sending…" : "Submit review"}
        </button>
      </div>
    </form>
  );
}
