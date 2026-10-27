"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, Printer } from "lucide-react";
import { toast } from "sonner";
import { ORDER_STATUSES, PAYMENT_STATUSES, type OrderStatus, type PaymentStatus } from "@/lib/types";
import { ORDER_STATUS_LABELS } from "@/lib/utils";
import { Card, CardHeader } from "@/components/admin/ui";
import { ui } from "@/components/admin/styles";
import { updateOrder } from "../actions";

const CARRIERS = ["Aramex", "Emirates Post", "DHL", "Fetchr", "Quiqup", "Careem Box", "In-house"];

export function PrintButton() {
  return (
    <button type="button" className={ui.btnGhost} onClick={() => window.print()}>
      <Printer size={14} /> Packing slip
    </button>
  );
}

export function OrderControls({
  order,
}: {
  order: {
    id: string;
    status: OrderStatus;
    payment_status: PaymentStatus;
    carrier: string | null;
    tracking_number: string | null;
    notes: string | null;
  };
}) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [payment, setPayment] = useState<PaymentStatus>(order.payment_status);
  const [carrier, setCarrier] = useState(order.carrier ?? "");
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const [notes, setNotes] = useState(order.notes ?? "");
  const [eventNote, setEventNote] = useState("");

  const statusChanged = status !== order.status;
  const dirty =
    statusChanged ||
    payment !== order.payment_status ||
    carrier !== (order.carrier ?? "") ||
    tracking !== (order.tracking_number ?? "") ||
    notes !== (order.notes ?? "");
  const restocks =
    statusChanged && (status === "cancelled" || status === "returned") && order.status !== "cancelled" && order.status !== "returned";
  const unrestocks =
    statusChanged && (order.status === "cancelled" || order.status === "returned") && status !== "cancelled" && status !== "returned";

  function save(e: React.FormEvent) {
    e.preventDefault();
    if ((status === "shipped" || status === "out_for_delivery") && !tracking.trim() && statusChanged) {
      toast.message("Tip: add a tracking number so the customer can follow the parcel.");
    }
    startTransition(async () => {
      const res = await updateOrder({
        id: order.id,
        status,
        payment_status: payment,
        carrier,
        tracking_number: tracking,
        notes,
        event_note: eventNote,
      });
      if (res.ok) {
        toast.success(statusChanged ? `Order marked ${ORDER_STATUS_LABELS[status]?.toLowerCase() ?? status}` : "Order updated");
        setEventNote("");
      } else toast.error(res.error);
    });
  }

  return (
    <Card>
      <CardHeader title="Manage order" />
      <form onSubmit={save} className="space-y-4 p-4 sm:p-5">
        <div>
          <label htmlFor="o-status" className={ui.label}>
            Order status
          </label>
          <select id="o-status" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} className={ui.input}>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s] ?? s}
              </option>
            ))}
          </select>
          {restocks && <p className="mt-1.5 text-xs text-[#b4532a]">Items will be put back into stock.</p>}
          {unrestocks && <p className="mt-1.5 text-xs text-[#b4532a]">Items will be taken out of stock again.</p>}
        </div>
        {statusChanged && (
          <div>
            <label htmlFor="o-event-note" className={ui.label}>
              Timeline note <span className="normal-case tracking-normal text-muted">(optional)</span>
            </label>
            <input
              id="o-event-note"
              value={eventNote}
              onChange={(e) => setEventNote(e.target.value)}
              className={ui.input}
              placeholder="e.g. Handed to courier at 4pm"
            />
          </div>
        )}
        <div>
          <label htmlFor="o-payment" className={ui.label}>
            Payment status
          </label>
          <select id="o-payment" value={payment} onChange={(e) => setPayment(e.target.value as PaymentStatus)} className={ui.input}>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 min-[360px]:grid-cols-2">
          <div>
            <label htmlFor="o-carrier" className={ui.label}>
              Carrier
            </label>
            <input
              id="o-carrier"
              list="carriers"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className={ui.input}
              placeholder="Aramex"
            />
            <datalist id="carriers">
              {CARRIERS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="o-tracking" className={ui.label}>
              Tracking no.
            </label>
            <input
              id="o-tracking"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              className={`${ui.input} font-mono text-xs`}
            />
          </div>
        </div>
        <div>
          <label htmlFor="o-notes" className={ui.label}>
            Internal notes
          </label>
          <textarea
            id="o-notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={ui.input}
            placeholder="Only visible to admins"
          />
        </div>
        <button type="submit" className={`${ui.btn} w-full`} disabled={!dirty || pending}>
          {pending && <LoaderCircle size={14} className="animate-spin" />}
          Save changes
        </button>
      </form>
    </Card>
  );
}
