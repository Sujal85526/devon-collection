import { revalidatePath } from "next/cache";
import type { z } from "zod";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type ActionResultWith<T> = { ok: true; data: T } | { ok: false; error: string };

export function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

/** First readable message from a zod error. */
export function zodMessage(error: z.ZodError) {
  const issue = error.issues[0];
  if (!issue) return "Invalid input";
  const field = issue.path.length ? `${String(issue.path[issue.path.length - 1])}: ` : "";
  return `${field}${issue.message}`;
}

/** Friendly message for a Postgres / PostgREST error. */
export function dbMessage(error: { code?: string; message: string; details?: string | null }) {
  if (error.code === "23505") {
    if (/slug/.test(error.message + (error.details ?? ""))) return "That slug is already in use.";
    if (/sku/.test(error.message + (error.details ?? ""))) return "That SKU is already in use.";
    if (/code/.test(error.message + (error.details ?? ""))) return "That code already exists.";
    return "A record with that value already exists.";
  }
  if (error.code === "23514") return "One of the values is out of range.";
  if (error.code === "42501") return "You don't have permission to do that.";
  return error.message;
}

/** Revalidates the whole app (admin + storefront) after catalog-level changes. */
export function revalidateCatalog() {
  revalidatePath("/", "layout");
}
