import type { Metadata } from "next";
import { AuthForm } from "@/components/store/AuthForm";

export const metadata: Metadata = { title: "Sign in" };

export default function AccountLoginPage() {
  return (
    <div className="mx-auto max-w-md px-6 pb-28 pt-16 md:pt-24">
      <header className="mb-10 text-center">
        <h1 className="mt-6 font-script text-5xl leading-none md:text-6xl">Welcome</h1>
        <p className="mt-5 text-sm text-muted">Sign in to see your orders and check out faster. You can always check out as a guest.</p>
      </header>
      <div className="border border-line bg-white p-6 md:p-8">
        <AuthForm />
      </div>
    </div>
  );
}
