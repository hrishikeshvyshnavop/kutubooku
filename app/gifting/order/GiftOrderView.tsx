"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "../../_components/ui/Button";
import { rupeesFmt } from "../../_lib/format";
import { ORDER_STAGES, PAYMENT_METHODS, arrivalLabel, shortDate, stageOf, wrapOf, type GiftOrder, type Wrap } from "../../_data/gift-checkout";
import { useGiftOrders } from "../../_lib/gift-orders";

export function GiftOrderView() {
  const id = useSearchParams().get("id");
  const orders = useGiftOrders();
  const [now] = useState(() => (typeof window === "undefined" ? null : new Date()));

  if (orders === null || !now) return <div className="flex-1" />;

  const order = orders.find((o) => o.id === id) ?? null;
  if (!order) return <OrderNotFound />;

  return <OrderDetails order={order} stage={stageOf(order, now)} />;
}

function OrderNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col p-2.5 sm:p-3">
      <section className="flex flex-1 flex-col items-center justify-center rounded-[36px] bg-[#fffdf8] px-page-inset py-20 text-center sm:rounded-[56px]">
        <h1 className="max-w-[18ch] type-display">We couldn&apos;t find that order</h1>
        <p className="mt-4 max-w-[44ch] type-body-lg text-[#1d2838]/70">
          Gift orders are saved on the device they were placed on. Check the email receipt for your order number.
        </p>
        <Button variant="split" href="/gifting" className="mt-8 w-fit">Back to gifting</Button>
      </section>
    </div>
  );
}

function OrderDetails({ order, stage }: { order: GiftOrder; stage: number }) {
  const wrap = wrapOf(order.wrap);
  const count = order.items.length;
  const payment = PAYMENT_METHODS.find((m) => m.value === order.payment)?.label ?? order.payment;
  const delivered = stage === ORDER_STAGES.length - 1;
  const arrival = arrivalLabel(order, delivered);
  const firstName = order.recipient.name.split(" ")[0];
  const headline = delivered
    ? `Your gift for ${firstName} has been delivered`
    : stage === 2
      ? `Your gift for ${firstName} is on its way`
      : `Your gift for ${firstName} is being wrapped`;

  return (
    <div className="mx-auto w-full max-w-[1920px] flex-1 p-2.5 sm:p-3">
      <section aria-labelledby="order-title" className="animate-q-in rounded-[36px] bg-[#fffdf8] px-page-inset pb-10 pt-8 sm:rounded-[56px] sm:pb-14 sm:pt-12 lg:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <p className="w-fit origin-bottom-left -rotate-3 font-[family-name:var(--font-caveat)] text-[28px] leading-none text-[#3b308f] sm:text-[36px]">
              thank you, {order.giver.name.split(" ")[0]}
            </p>
            <h1 id="order-title" className="mt-3 max-w-[16ch] type-display">
              {headline}
            </h1>
            <p className="mt-4 max-w-[48ch] type-body-lg text-[#1d2838]/70">
              We&apos;ve sent the receipt to {order.giver.email}. You&apos;ll get updates on {order.giver.phone} as it moves.
            </p>
            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              <div>
                <dt className="type-body-sm text-[#1d2838]/60">Order number</dt>
                <dd className="type-title-sm tabular-nums">{order.id}</dd>
              </div>
              <div>
                <dt className="type-body-sm text-[#1d2838]/60">Delivery</dt>
                <dd className="type-title-sm">{arrival}</dd>
              </div>
            </dl>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button variant="split" href="/gifting/quiz" className="w-fit">Send another gift</Button>
              <Button href="/gifting/orders" variant="secondary">
                All my gifts
              </Button>
            </div>
          </div>

          <GiftVisual wrap={wrap} note={order.note} from={order.from} count={count} />
        </div>

        <Tracker order={order} stage={stage} className="mt-12 sm:mt-16" />
      </section>

      <div className="mt-2.5 grid gap-2.5 sm:mt-3 sm:gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
        <section aria-labelledby="order-books-title" className="rounded-[28px] bg-[#fffdf8] px-page-inset py-6 sm:rounded-[40px] sm:py-8">
          <h2 id="order-books-title" className="type-title">
            In the gift
          </h2>
          <ul className="mt-5 flex flex-col gap-2">
            {order.items.map((item) => (
              <li key={item.bookId} className="flex items-center gap-4 rounded-[24px] bg-[#f4eee3] p-3 pr-5">
                <span className="relative size-16 shrink-0 overflow-hidden rounded-[14px] bg-[#fffdf8]">
                  <Image src={item.cover} alt="" fill sizes="64px" className="object-contain p-1.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate type-title-sm">{item.title}</p>
                  <p className="truncate type-body-sm text-[#1d2838]/65">by {item.author}</p>
                </div>
                <p className="type-title-sm tabular-nums">{rupeesFmt(item.price)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="order-delivery-title" className="rounded-[28px] bg-[#1d2838] p-6 text-[#fffdf8] sm:rounded-[40px] sm:p-8">
          <h2 id="order-delivery-title" className="type-title">
            Delivery
          </h2>
          <p className="mt-4 type-body">{order.recipient.name}</p>
          <p className="mt-1 type-body-sm text-[#fffdf8]/75">
            {order.recipient.address} {order.recipient.pin}
          </p>
          <p className="mt-1 type-body-sm text-[#fffdf8]/75">{order.recipient.phone}</p>
          <dl className="mt-6 flex flex-col gap-2 border-t border-white/15 pt-6 type-body-sm">
            <div className="flex justify-between">
              <dt className="text-[#fffdf8]/70">Wrapping</dt>
              <dd>{wrap.label}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#fffdf8]/70">Packing slip</dt>
              <dd>{order.hidePrices ? "Prices hidden" : "Prices shown"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#fffdf8]/70">Paid with</dt>
              <dd>{payment}</dd>
            </div>
            <div className="mt-2 flex items-baseline justify-between border-t border-white/15 pt-4">
              <dt className="type-title-sm">Total paid</dt>
              <dd className="type-title tabular-nums">{rupeesFmt(order.total)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}

function GiftVisual({ wrap, note, from, count }: { wrap: Wrap; note: string; from: string; count: number }) {
  const paper = { backgroundColor: wrap.paper, backgroundImage: wrap.pattern, backgroundSize: "26px 26px" };
  return (
    <div aria-hidden className="relative mx-auto flex h-[340px] w-full max-w-[520px] items-end justify-center sm:h-[400px]">
      <div className="relative mb-6 w-[62%] max-w-[300px]">
        <svg viewBox="0 0 120 70" className="absolute -top-[52px] left-1/2 w-[46%] -translate-x-1/2 drop-shadow-[0_4px_6px_rgb(0_0_0/0.25)] sm:-top-[64px]">
          <path d="M60 60 C38 22 4 22 10 46 C14 62 42 62 60 60Z" fill={wrap.ribbon} />
          <path d="M60 60 C82 22 116 22 110 46 C106 62 78 62 60 60Z" fill={wrap.ribbon} />
          <circle cx="60" cy="58" r="9" fill={wrap.ribbon} stroke="rgb(0 0 0/0.2)" strokeWidth="2" />
        </svg>
        <div className="relative z-10 -mx-[4%] h-12 rounded-[10px] shadow-[0_6px_10px_-6px_rgb(0_0_0/0.35)]" style={paper}>
          <span className="absolute inset-y-0 left-1/2 w-[14%] -translate-x-1/2" style={{ background: wrap.ribbon }} />
        </div>
        <div className="relative aspect-square rounded-b-[12px] shadow-[0_24px_40px_-24px_rgba(29,40,56,0.7)]" style={paper}>
          <span className="absolute inset-y-0 left-1/2 w-[14%] -translate-x-1/2" style={{ background: wrap.ribbon }} />
          <span className="absolute bottom-3 right-3 rounded-full bg-[#fffdf8] px-3 py-1 type-body-sm font-semibold text-[#1d2838]">
            {count} {count === 1 ? "book" : "books"}
          </span>
        </div>
      </div>
      <div className="absolute bottom-2 left-0 w-[52%] max-w-[240px] rotate-[-6deg] rounded-[14px] bg-[#fffdf8] p-5 shadow-[0_16px_32px_-16px_rgba(29,40,56,0.55)] sm:left-[2%]">
        <span className="absolute -top-2 left-6 size-4 rounded-full border-4 border-[#f4efe6] bg-[#f9a220]" />
        <p className="line-clamp-4 font-[family-name:var(--font-caveat)] text-[22px] leading-[1.1] text-[#1d2838]">{note || "Happy reading!"}</p>
        {from && <p className="mt-2 text-right font-[family-name:var(--font-caveat)] text-[20px] leading-none text-[#1d2838]/70">— {from}</p>}
      </div>
    </div>
  );
}

export function Tracker({ order, stage: current, className = "" }: { order: GiftOrder; stage: number; className?: string }) {
  const dates = [shortDate(order.placedAt), "", "", shortDate(order.deliverAfter || order.arrives[1])];
  const last = ORDER_STAGES.length - 1;
  return (
    <ol aria-label="Order status" className={`grid grid-cols-4 gap-1.5 sm:gap-2 ${className}`}>
      {ORDER_STAGES.map((stage, i) => {
        const state = i < current || current === last ? "done" : i === current ? "current" : "next";
        return (
          <li key={stage} aria-current={state === "current" ? "step" : undefined}>
            <div className={`h-2.5 rounded-full ${state === "next" ? "bg-[#1d2838]/15" : state === "current" ? "bg-[#f9a220]" : "bg-[#1d2838]"}`} />
            <p className={`mt-3 type-label ${state === "next" ? "text-[#1d2838]/50" : ""}`}>
              {stage}
              <span className="sr-only">{state === "done" ? " (done)" : state === "current" ? " (in progress)" : ""}</span>
            </p>
            <p className="type-body-sm text-[#1d2838]/60">{state === "next" && i === ORDER_STAGES.length - 1 ? `By ${dates[i]}` : dates[i]}</p>
          </li>
        );
      })}
    </ol>
  );
}
