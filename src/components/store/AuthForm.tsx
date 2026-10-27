"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";

/** Password input with a show/hide eye toggle. */
export function PasswordField({
  name,
  label,
  autoComplete,
  hint,
  error,
}: {
  name: string;
  label: string;
  autoComplete: string;
  hint?: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block">
      <span className="label">{label}</span>
      <span className="relative block">
        <input
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={8}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          className={cn("field pr-12", error && "border-alert")}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 grid w-12 place-items-center text-ink/50 transition-colors hover:text-ink"
        >
          {visible ? <EyeOff className="size-[18px]" strokeWidth={1.5} /> : <Eye className="size-[18px]" strokeWidth={1.5} />}
        </button>
      </span>
      {error ? <span className="mt-1.5 block text-xs text-alert">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmError, setConfirmError] = useState<string>();
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = f.get("email")!.toString().trim();
    const password = f.get("password")!.toString();
    setMessage(null);
    setConfirmError(undefined);

    if (mode === "signup" && password !== f.get("confirm")?.toString()) {
      setConfirmError("Passwords don't match.");
      return;
    }

    if (!isSupabaseConfigured) {
      setMessage({ ok: false, text: "Accounts open very soon. Message us on WhatsApp for help with an order." });
      return;
    }

    start(async () => {
      const supabase = createClient();
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setMessage({ ok: false, text: "Email or password is incorrect." });
          return;
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: f.get("full_name")?.toString().trim() } },
        });
        if (error) {
          setMessage({ ok: false, text: error.message });
          return;
        }
        if (!data.session) {
          setMessage({ ok: true, text: "Check your inbox to confirm your email, then sign in." });
          return;
        }
      }
      router.push("/account");
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-8 grid grid-cols-2 rounded-full bg-ink/5 p-1">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setMessage(null);
              setConfirmError(undefined);
            }}
            className={cn(
              "rounded-full py-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] transition-colors",
              mode === m ? "bg-ink text-paper" : "text-ink/60 hover:text-ink",
            )}
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>
      <form key={mode} onSubmit={onSubmit} className="space-y-4">
        {mode === "signup" && (
          <label className="block">
            <span className="label">Full name</span>
            <input name="full_name" required className="field" autoComplete="name" />
          </label>
        )}
        <label className="block">
          <span className="label">Email</span>
          <input name="email" type="email" required className="field" autoComplete="email" />
        </label>
        <PasswordField
          name="password"
          label="Password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          hint={mode === "signup" ? "At least 8 characters." : undefined}
        />
        {mode === "signup" && <PasswordField name="confirm" label="Confirm password" autoComplete="new-password" error={confirmError} />}
        {message && <p className={cn("text-sm", message.ok ? "text-rose" : "text-alert")}>{message.text}</p>}
        <button disabled={pending} className="btn-primary w-full">
          {pending ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
