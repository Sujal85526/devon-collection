import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderDetails } from "@/components/store/OrderDetails";
import { Reveal } from "@/components/store/Reveal";
import { findOrder } from "@/lib/orders";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

export default async function OrderPage(props: PageProps<"/order/[number]">) {
  const { number } = await props.params;
  const sp = await props.searchParams;
  const email = typeof sp.email === "string" ? sp.email : undefined;
  const data = await findOrder(number, email);
  if (!data) notFound();
  const isNew = sp.new === "1";

  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-28 pt-16 md:px-10 md:pt-24">
      <Reveal className="mb-14 text-center">
        <p className="eyebrow text-ink/60">Order {data.order.order_number}</p>
        <h1 className="mt-3 font-script text-5xl leading-none md:text-7xl">{isNew ? "Thank you!" : "Your order"}</h1>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-muted">
          {isNew
            ? `We've received your order and will confirm it shortly. A copy of the details is below — keep your order number (${data.order.order_number}) to track it.`
            : `Placed on ${formatDate(data.order.created_at)}.`}
        </p>
      </Reveal>
      <OrderDetails data={data} />
      <div className="mt-16 text-center">
        <Link href="/shop" className="btn-outline">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
