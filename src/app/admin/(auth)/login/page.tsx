import type { Metadata } from "next";
import Image from "next/image";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 lg:flex">
        <Image src="/brand/logo-pink.png" alt="Devon Collection" width={960} height={220} className="h-12 w-auto self-start" priority />
        <div>
          <p className="eyebrow mb-4 text-rose">Store admin</p>
          <p className="max-w-md font-serif text-4xl leading-tight text-paper">
            Luxury in <em>each detail.</em>
          </p>
          <p className="mt-4 max-w-sm text-sm text-paper/60">
            Manage the catalogue, orders, inventory and reviews for Devon Collection.
          </p>
        </div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-paper/40">Devon Collection · UAE</p>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Image
            src="/brand/logo-black.png"
            alt="Devon Collection"
            width={960}
            height={220}
            className="mx-auto mb-10 h-10 w-auto lg:hidden"
            priority
          />
          <h1 className="font-serif text-3xl text-ink">Welcome back</h1>
          <p className="mt-2 text-sm text-muted">Sign in with your admin account.</p>

          {error === "not-admin" && (
            <div role="alert" className="mt-6 border-l-2 border-alert bg-alert/10 px-4 py-3 text-sm text-[#9a4521]">
              This account doesn&apos;t have admin access. Sign in with an admin account.
            </div>
          )}
          {!isSupabaseConfigured && (
            <div role="alert" className="mt-6 border-l-2 border-ink/40 bg-ink/5 px-4 py-3 text-sm text-ink/80">
              Supabase isn&apos;t configured yet. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to sign in.
            </div>
          )}

          <LoginForm disabled={!isSupabaseConfigured} />
        </div>
      </div>
    </main>
  );
}
