"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/account/login");
  await supabase
    .from("profiles")
    .update({
      full_name: formData.get("full_name")?.toString().trim().slice(0, 100) ?? "",
      phone: formData.get("phone")?.toString().trim().slice(0, 30) ?? "",
    })
    .eq("id", user.id);
  revalidatePath("/account");
}
