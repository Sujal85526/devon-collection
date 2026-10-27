import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "./env";

/** Cookie-less client for public catalog reads, so storefront pages can be statically cached. */
export function createPublicClient() {
  if (!isSupabaseConfigured) return null;
  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
