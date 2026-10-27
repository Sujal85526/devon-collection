import { createClient } from "@/lib/supabase/server";
import type { Order, OrderEvent, OrderItem } from "@/lib/types";

export type TrackedOrder = { order: Order; items: OrderItem[]; events: OrderEvent[] };

/** Looks up an order by number + email (guests), or by number alone when the signed-in customer owns it. */
export async function findOrder(orderNumber: string, email?: string): Promise<TrackedOrder | null> {
  const supabase = await createClient();
  if (email) {
    const { data } = await supabase.rpc("track_order", { p_order_number: orderNumber, p_email: email });
    if (data) return data as TrackedOrder;
  }
  const { data: order } = await supabase.from("orders").select("*").eq("order_number", orderNumber.toUpperCase()).maybeSingle();
  if (!order) return null;
  const [{ data: items }, { data: events }] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", order.id),
    supabase.from("order_events").select("*").eq("order_id", order.id).order("created_at"),
  ]);
  return { order, items: items ?? [], events: events ?? [] };
}
