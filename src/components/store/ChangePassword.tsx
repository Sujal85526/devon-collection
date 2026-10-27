"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { PasswordField } from "./AuthForm";

/** Lets a signed-in customer set a new password (with confirm + show/hide). */
export function ChangePassword() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const password = f.get("password")!.toString();
    if (password !== f.get("confirm")?.toString()) {
      setError("Passwords don't match.");
      return;
    }
    setError(undefined);
    start(async () => {
      const { error: err } = await createClient().auth.updateUser({ password });
      if (err) {
        toast.error(err.message);
        return;
      }
      form.reset();
      toast("Password updated");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PasswordField name="password" label="New password" autoComplete="new-password" hint="At least 8 characters." />
      <PasswordField name="confirm" label="Confirm new password" autoComplete="new-password" error={error} />
      <button disabled={pending} className="btn-outline w-full">
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
