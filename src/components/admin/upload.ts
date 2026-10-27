"use client";

import { createClient } from "@/lib/supabase/client";

export const IMAGE_BUCKET = "product-images";

/** Uploads an image to the public `product-images` bucket and returns its public URL. */
export async function uploadImage(file: File, folder: "products" | "categories") {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image`);
  if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name} is larger than 8 MB`);
  const supabase = createClient();
  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const path = `${folder}/${crypto.randomUUID()}-${safeName || "image"}`;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}
