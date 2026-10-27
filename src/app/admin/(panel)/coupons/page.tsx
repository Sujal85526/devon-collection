import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import type { Coupon } from "@/lib/types";
import { CouponsManager } from "./CouponsManager";

export const metadata: Metadata = { title: "Coupons" };

export default async function CouponsPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
  return <CouponsManager coupons={(data ?? []) as Coupon[]} error={error?.message} />;
}
