import type { Metadata } from "next";
import { OrderDetails } from "@/components/store/OrderDetails";
import { findOrder } from "@/lib/orders";

export const metadata: Metadata = { title: "Track your order" };

export default async function TrackPage(props: PageProps<"/track">) {
  const sp = await props.searchParams;
  const order = typeof sp.order === "string" ? sp.order.trim() : "";
  const email = typeof sp.email === "string" ? sp.email.trim() : "";
  const data = order && email ? await findOrder(order, email) : null;
  const searched = Boolean(order && email);

  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-28 pt-16 md:px-10 md:pt-24">
      <header className="text-center">
        <h1 className="mt-6 font-script text-5xl leading-none md:text-7xl">Track your order</h1>
        <p className="mt-4 text-sm text-muted">Enter your order number and the email you used at checkout.</p>
      </header>
      <form className="mx-auto mt-12 grid max-w-2xl gap-4 rounded-2xl bg-paper p-6 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end md:p-8">
        <label>
          <span className="label">Order number</span>
          <input name="order" required defaultValue={order} placeholder="CR1001" className="field uppercase" />
        </label>
        <label>
          <span className="label">Email used at checkout</span>
          <input name="email" type="email" required defaultValue={email} className="field" />
        </label>
        <button className="btn-primary">Track</button>
      </form>
      <div className="mt-16">
        {searched && !data && (
          <p className="mx-auto max-w-md text-center text-sm text-muted">
            We couldn&apos;t find an order with those details. Check the order number in your confirmation and try again.
          </p>
        )}
        {data && <OrderDetails data={data} />}
      </div>
    </div>
  );
}
