import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Sidebar } from "@/components/admin/Sidebar";
import { signOut } from "./actions";

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured) redirect("/admin/login");
  const { supabase, user, profile } = await requireAdmin();

  const [orders, reviews, settings] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("store_settings").select("store_open").eq("id", 1).maybeSingle(),
  ]);

  return (
    <div className="min-h-screen">
      <Sidebar
        email={profile?.email ?? user.email ?? ""}
        counts={{ pendingOrders: orders.count ?? 0, pendingReviews: reviews.count ?? 0 }}
        signOut={signOut}
        storeOpen={settings.data?.store_open ?? true}
      />
      <main className="lg:pl-64 print:pl-0">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-12 print:p-0">{children}</div>
      </main>
    </div>
  );
}
