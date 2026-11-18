"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CtaButton } from "../../_components/ui/CtaButton";
import { rupeesFmt } from "../../_lib/format";
import { ORDER_STAGES, arrivalLabel, shortDate, stageOf, wrapOf, type GiftOrder, type Wrap } from "../../_data/gift-checkout";
import { useGiftOrders } from "../../_lib/gift-orders";
import { Tracker } from "../order/GiftOrderView";

const STATUS_TONES = ["bg-[#a9dfc0]", "bg-[#ffe75e]", "bg-[#b6beff]", "bg-[#a9dfc0]"];

export function GiftOrders() {
  const orders = useGiftOrders();
  const [now] = useState(() => (typeof window === "undefined" ? null : new Date()));

  if (orders === null || !now) return <div className="flex-1" />;

  const withStage = orders.map((order) => ({ order, stage: stageOf(order, now) }));
  const last = ORDER_STAGES.length - 1;
  const active = withStage.filter((o) => o.stage < last);
  const delivered = withStage.filter((o) => o.stage === last);

  return (
    <div className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col gap-2.5 p-2.5 sm:gap-3 sm:p-3">
      <header className="flex flex-col gap-6 rounded-[36px] bg-[#fffdf8] px-page-inset pb-8 pt-8 sm:flex-row sm:items-end sm:justify-between sm:rounded-[48px] sm:pt-12">
        <div>
          <p className="w-fit origin-bottom-left -rotate-3 font-[family-name:var(--font-caveat)] text-[28px] leading-none text-[#3b308f] sm:text-[32px]">
            your gifts
          </p>
          <h1 className="mt-3 type-display">My gifts</h1>
          <p className="mt-3 max-w-[52ch] type-body-lg text-[#1d2838]/70">
            {orders.length
              ? `${orders.length} ${orders.length === 1 ? "gift" : "gifts"} sent. See where each one is.`
              : "Gifts you send will show up here, with where each one is."}
          </p>
        </div>
        <CtaButton href="/gifting/quiz" label="Send a gift" className="w-fit shrink-0" />
      </header>

      {!orders.length ? (
        <EmptyGifts />
      ) : (
        <>
          {active.length > 0 && <OrderGroup title="On the way" orders={active} />}
          {delivered.length > 0 && <OrderGroup title="Delivered" orders={delivered} />}
          <p className="px-page-inset pb-4 pt-2 type-body-sm text-[#1d2838]/60">
            Gift orders are saved on this device. Your email receipt has a link to each order too.
          </p>
        </>
      )}
    </div>
  );
}

function EmptyGifts() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center rounded-[36px] bg-[#fffdf8] px-page-inset py-20 text-center sm:rounded-[56px]">
      <MiniGift wrap={wrapOf("sunshine")} className="size-24 rotate-[-6deg]" />
      <h2 className="mt-8 type-title">No gifts yet</h2>
      <p className="mt-3 max-w-[40ch] type-body-lg text-[#1d2838]/70">
        Tell us a little about a child and we&apos;ll suggest books to gift. We wrap and deliver them for free.
      </p>
      <CtaButton href="/gifting/quiz" label="Find a gift for a child" className="mt-8 w-fit" />
    </section>
  );
}

function OrderGroup({ title, orders }: { title: string; orders: { order: GiftOrder; stage: number }[] }) {
  const id = `gifts-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="rounded-[28px] bg-[#fffdf8] px-page-inset py-6 sm:rounded-[40px] sm:py-8">
      <h2 id={id} className="flex items-baseline gap-3 type-title">
        {title}
        <span className="type-body-sm font-normal tabular-nums text-[#1d2838]/50">{orders.length}</span>
      </h2>
      <ul className="mt-5 flex flex-col gap-3">
        {orders.map(({ order, stage }) => (
          <li key={order.id}>
            <OrderCard order={order} stage={stage} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function OrderCard({ order, stage }: { order: GiftOrder; stage: number }) {
  const wrap = wrapOf(order.wrap);
  const delivered = stage === ORDER_STAGES.length - 1;
  const books = order.items.map((i) => i.title);
  const bookLine = books.length > 2 ? `${books.slice(0, 2).join(", ")} and ${books.length - 2} more` : books.join(" and ");

  return (
    <Link
      href={`/gifting/order?id=${order.id}`}
      className="group block rounded-[24px] bg-[#f4eee3] p-4 transition-colors hover:bg-[#ece3d3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838] sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <MiniGift wrap={wrap} className="size-16 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-6 sm:size-20" />
          <div className="min-w-0">
            <p className="type-title-sm">For {order.recipient.name}</p>
            <p className="mt-1 truncate type-body-sm text-[#1d2838]/70">{bookLine}</p>
            <p className="mt-1 type-body-sm tabular-nums text-[#1d2838]/50">
              {order.id} · {shortDate(order.placedAt)} · {rupeesFmt(order.total)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-2">
          <span className={`rounded-full px-3 py-1 type-label ${STATUS_TONES[stage]}`}>{ORDER_STAGES[stage]}</span>
          <span className="type-body-sm text-[#1d2838]/70">{arrivalLabel(order, delivered)}</span>
        </div>

        <span
          aria-hidden
          className="hidden size-10 shrink-0 place-items-center rounded-full bg-[#fffdf8] transition-[background-color,translate] group-hover:translate-x-0.5 group-hover:bg-[#f9a220] sm:grid"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="flex -space-x-2">
          {order.items.slice(0, 4).map((item) => (
            <span key={item.bookId} className="relative size-8 overflow-hidden rounded-[8px] bg-[#fffdf8] ring-2 ring-[#f4eee3]">
              <Image src={item.cover} alt="" fill sizes="32px" className="object-cover" />
            </span>
          ))}
        </span>
        <span aria-hidden className="flex-1">
          <Tracker order={order} stage={stage} className="[&_p]:hidden" />
        </span>
      </div>
      <span className="sr-only">
        Status: {ORDER_STAGES[stage]}. Open order {order.id}.
      </span>
    </Link>
  );
}

function MiniGift({ wrap, className = "" }: { wrap: Wrap; className?: string }) {
  return (
    <span
      aria-hidden
      className={`relative block overflow-hidden rounded-[14px] shadow-[0_10px_20px_-12px_rgba(29,40,56,0.6)] ${className}`}
      style={{ backgroundColor: wrap.paper, backgroundImage: wrap.pattern, backgroundSize: "18px 18px" }}
    >
      <span className="absolute inset-y-0 left-1/2 w-[16%] -translate-x-1/2" style={{ background: wrap.ribbon }} />
      <span className="absolute inset-x-0 top-1/2 h-[16%] -translate-y-1/2" style={{ background: wrap.ribbon }} />
      <span className="absolute left-1/2 top-1/2 size-[30%] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[4px]" style={{ background: wrap.ribbon }} />
    </span>
  );
}
