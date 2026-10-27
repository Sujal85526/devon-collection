import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Returns the signed-in user and their profile, or nulls. */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, role")
    .eq("id", user.id)
    .single();
  return { supabase, user, profile };
}

/** Guards admin pages and actions. Redirects to the admin login when not an admin. */
export async function requireAdmin() {
  const session = await getSession();
  if (!session.user || session.profile?.role !== "admin") redirect("/admin/login?error=not-admin");
  return session as typeof session & { user: NonNullable<typeof session.user> };
}
