import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { FilterBar } from "@/components/admin/FilterBar";
import { searchTerm } from "../../_lib/dates";
import { ReviewCard, type ReviewRow } from "./ReviewCard";

export const metadata: Metadata = { title: "Reviews" };

const TABS = ["pending", "approved", "rejected", "all"] as const;
type Tab = (typeof TABS)[number];

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const status: Tab = (TABS as readonly string[]).includes(sp.status ?? "") ? (sp.status as Tab) : "pending";
  const q = sp.q ?? "";
  const { supabase } = await requireAdmin();

  let query = supabase
    .from("reviews")
    .select("*, product:products(id, name, slug, images)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status !== "all") query = query.eq("status", status);
  const term = searchTerm(q);
  if (term) query = query.or(`author_name.ilike.%${term}%,title.ilike.%${term}%,body.ilike.%${term}%`);

  const [{ data, error }, ...counts] = await Promise.all([
    query,
    ...(["pending", "approved", "rejected"] as const).map((s) =>
      supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", s),
    ),
  ]);
  const countFor: Record<Tab, number> = {
    pending: counts[0].count ?? 0,
    approved: counts[1].count ?? 0,
    rejected: counts[2].count ?? 0,
    all: (counts[0].count ?? 0) + (counts[1].count ?? 0) + (counts[2].count ?? 0),
  };
  const reviews = (data ?? []) as unknown as ReviewRow[];

  const href = (tab: Tab) => {
    const p = new URLSearchParams();
    if (tab !== "pending") p.set("status", tab);
    if (q) p.set("q", q);
    const s = p.toString();
    return s ? `/admin/reviews?${s}` : "/admin/reviews";
  };

  return (
    <>
      <PageHeader
        eyebrow="Customers"
        title="Reviews"
        description="Approve reviews before they appear on product pages. Replies are shown publicly beneath the review."
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1 overflow-x-auto border-b border-ink/10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <Link
              key={t}
              href={href(t)}
              scroll={false}
              className={cn(
                "-mb-px flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs sm:px-4 font-semibold uppercase tracking-[0.14em] transition-colors",
                status === t ? "border-ink text-ink" : "border-transparent text-ink/50 hover:text-ink",
              )}
            >
              {t}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] leading-4",
                  t === "pending" && countFor.pending > 0 ? "bg-alert text-white" : "bg-ink/5 text-ink/60",
                )}
              >
                {countFor[t]}
              </span>
            </Link>
          ))}
        </div>
        <FilterBar
          className="lg:w-96"
          values={{ q, status: status === "pending" ? "" : status }}
          searchPlaceholder="Search author, title or text…"
        />
      </div>

      {error && <p className="mb-4 bg-red-50 px-4 py-3 text-sm text-red-700">{error.message}</p>}

      {reviews.length === 0 ? (
        <Card>
          <EmptyState
            icon={<MessageSquare size={20} />}
            title={status === "pending" && !q ? "All caught up" : "No reviews"}
            description={
              q ? "No reviews match your search." : status === "pending" ? "There are no reviews waiting for moderation." : undefined
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}
    </>
  );
}
