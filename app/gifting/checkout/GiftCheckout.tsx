"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowIcon, Button } from "../../_components/Button";
import { CtaButton } from "../../_components/CtaButton";
import { DatePicker } from "../../_components/DatePicker";
import { rupeesFmt } from "../../_components/curation/ui";
import {
  BANKS,
  EMPTY_DRAFT,
  NOTE_MAX,
  PAYMENT_METHODS,
  WRAPS,
  addDays,
  deliveryDays,
  giftBook,
  isValidEmail,
  isValidPhone,
  isValidPin,
  isoDate,
  shortDate,
  wrapOf,
  type CheckoutDraft,
  type GiftOrder,
  type Wrap,
} from "../../_data/gift-checkout";
import type { MockBook } from "../../_data/curation-mock";
import { clearGiftBasket, toggleGift, useGiftBasket } from "../../_lib/gift-basket";
import { newOrderId, saveGiftOrder } from "../../_lib/gift-orders";
import { useSession } from "../../_lib/session";

const DRAFT_KEY = "kb:gift-checkout";
const PAY_MS = 1800;
const STEP_TITLES = ["Your gift basket", "Who's it going to?", "Note and wrapping", "Payment"];

type Card = { number: string; expiry: string; cvv: string };
const EMPTY_CARD: Card = { number: "", expiry: "", cvv: "" };

function loadDraft(): CheckoutDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? { ...EMPTY_DRAFT, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

function saveDraft(d: CheckoutDraft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {}
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {}
}

type Errors = Partial<Record<keyof CheckoutDraft | keyof Card, string>>;

function recipientErrors(d: CheckoutDraft): Errors {
  const e: Errors = {};
  if (!d.recipientName.trim()) e.recipientName = "Add the name to deliver to.";
  if (!isValidPhone(d.recipientPhone)) e.recipientPhone = "Add a 10-digit mobile number for the delivery partner.";
  if (!d.address1.trim()) e.address1 = "Add the house and street.";
  if (!d.city.trim()) e.city = "Add the city or town.";
  if (!d.state.trim()) e.state = "Add the state.";
  if (!isValidPin(d.pin)) e.pin = "Add a 6-digit PIN code.";
  return e;
}

function paymentErrors(d: CheckoutDraft, card: Card): Errors {
  const e: Errors = {};
  if (!d.giverName.trim()) e.giverName = "Add your name for the receipt.";
  if (!isValidEmail(d.giverEmail)) e.giverEmail = "Add an email so we can send the receipt.";
  if (!isValidPhone(d.giverPhone)) e.giverPhone = "Add a 10-digit mobile number for delivery updates.";
  if (d.payment === "upi" && !/^[\w.-]+@[a-zA-Z]+$/.test(d.upiId.trim())) e.upiId = "Add a UPI ID like name@bank.";
  if (d.payment === "card") {
    if (card.number.replace(/\s/g, "").length !== 16) e.number = "Add the 16-digit card number.";
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) e.expiry = "Use MM/YY.";
    if (!/^\d{3}$/.test(card.cvv)) e.cvv = "3 digits.";
  }
  if (d.payment === "netbanking" && !d.bank) e.bank = "Choose your bank.";
  return e;
}

export function GiftCheckout() {
  const router = useRouter();
  const session = useSession();
  const basket = useGiftBasket();
  const [today] = useState(() => (typeof window === "undefined" ? null : new Date()));
  const [draft, setDraft] = useState<CheckoutDraft>(EMPTY_DRAFT);
  const [card, setCard] = useState<Card>(EMPTY_CARD);
  const [open, setOpen] = useState(0);
  const [reached, setReached] = useState(0);
  const [showErrors, setShowErrors] = useState<Record<number, boolean>>({});
  const [paying, setPaying] = useState(false);
  const payTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const saved = loadDraft();
      setDraft((d) => {
        const base = saved ?? d;
        if (!session) return base;
        return { ...base, giverName: base.giverName || session.name, giverEmail: base.giverEmail || session.email };
      });
    });
    return () => window.clearTimeout(t);
  }, [session]);

  useEffect(() => () => window.clearTimeout(payTimer.current), []);

  if (basket === null || !today) return <div className="flex-1" />;

  const books = basket.map(giftBook).filter((b): b is MockBook => !!b);
  if (!books.length && !paying) return <EmptyBasket />;

  const total = books.reduce((sum, b) => sum + b.price, 0);
  const [minDays, maxDays] = deliveryDays(draft.pin, basket);
  const earliest = addDays(today, minDays);
  const arrives: [Date, Date] = [addDays(today, minDays), addDays(today, maxDays)];
  const afterDate = draft.deliverAfter && new Date(draft.deliverAfter) > arrives[0] ? new Date(draft.deliverAfter) : null;
  const arrivalText = afterDate ? `Arrives on or after ${shortDate(afterDate)}` : `Arrives ${shortDate(arrives[0])}–${shortDate(arrives[1])}`;

  const update = <K extends keyof CheckoutDraft>(key: K, value: CheckoutDraft[K]) =>
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      saveDraft(next);
      return next;
    });

  const errorsFor = (step: number): Errors => (step === 1 ? recipientErrors(draft) : step === 3 ? paymentErrors(draft, card) : {});
  const visibleErrors = (step: number) => (showErrors[step] ? errorsFor(step) : {});

  const advance = (step: number) => {
    if (Object.keys(errorsFor(step)).length) {
      setShowErrors((s) => ({ ...s, [step]: true }));
      return;
    }
    setOpen(step + 1);
    setReached((r) => Math.max(r, step + 1));
  };

  const pay = () => {
    if (Object.keys(errorsFor(3)).length) {
      setShowErrors((s) => ({ ...s, 3: true }));
      return;
    }
    setPaying(true);
    payTimer.current = window.setTimeout(() => {
      const order: GiftOrder = {
        id: newOrderId(),
        placedAt: new Date().toISOString(),
        items: books.map((b) => ({ bookId: b.id, title: b.title, author: b.author, cover: b.cover, price: b.price })),
        total,
        recipient: {
          name: draft.recipientName.trim(),
          phone: draft.recipientPhone.trim(),
          address: [draft.address1, draft.address2, draft.city, draft.state].map((s) => s.trim()).filter(Boolean).join(", "),
          pin: draft.pin.trim(),
        },
        giver: { name: draft.giverName.trim(), email: draft.giverEmail.trim(), phone: draft.giverPhone.trim() },
        note: draft.note.trim(),
        from: draft.from.trim() || draft.giverName.trim(),
        wrap: draft.wrap,
        hidePrices: draft.hidePrices,
        deliverAfter: afterDate ? isoDate(afterDate) : "",
        payment: draft.payment,
        arrives: [isoDate(afterDate ?? arrives[0]), isoDate(afterDate ? addDays(afterDate, 2) : arrives[1])],
      };
      saveGiftOrder(order);
      clearGiftBasket();
      clearDraft();
      router.push(`/gifting/order?id=${order.id}`);
    }, PAY_MS);
  };

  const summaries = [
    `${books.length} ${books.length === 1 ? "book" : "books"} · ${rupeesFmt(total)}`,
    draft.recipientName && isValidPin(draft.pin) ? `${draft.recipientName}, ${draft.city || draft.pin} · ${draft.pin}` : "",
    `${wrapOf(draft.wrap).label} wrap${draft.note.trim() ? " · with a note" : ""}`,
    "",
  ];

  return (
    <div className="mx-auto w-full max-w-[1920px] flex-1 p-2.5 sm:p-3">
      <div className="grid gap-2.5 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-3">
        <main className="flex flex-col gap-2.5 lg:gap-3">
          <header className="rounded-[36px] bg-[#fffdf8] px-page-inset pb-8 pt-8 sm:rounded-[48px] sm:pt-12">
            <p className="w-fit origin-bottom-left -rotate-3 font-[family-name:var(--font-caveat)] text-[28px] leading-none text-[#3b308f] sm:text-[32px]">
              send your gift
            </p>
            <h1 className="mt-3 type-display">Checkout</h1>
            <p className="mt-3 type-body-lg text-[#1d2838]/70">You pay book prices only. Wrapping, the card and delivery are on us.</p>
          </header>

          {STEP_TITLES.map((title, i) => (
            <StepCard
              key={title}
              index={i}
              title={title}
              open={open === i}
              done={reached > i && open !== i}
              summary={summaries[i]}
              onEdit={reached >= i && !paying ? () => setOpen(i) : undefined}
            >
              {i === 0 && (
                <BasketStep books={books} onContinue={() => advance(0)} />
              )}
              {i === 1 && (
                <RecipientStep
                  draft={draft}
                  update={update}
                  errors={visibleErrors(1)}
                  earliest={earliest}
                  arrivalText={isValidPin(draft.pin) ? arrivalText : null}
                  onContinue={() => advance(1)}
                />
              )}
              {i === 2 && <NoteStep draft={draft} update={update} onContinue={() => advance(2)} />}
              {i === 3 && (
                <PaymentStep
                  draft={draft}
                  update={update}
                  card={card}
                  setCard={setCard}
                  errors={visibleErrors(3)}
                  total={total}
                  paying={paying}
                  onPay={pay}
                />
              )}
            </StepCard>
          ))}
        </main>

        <OrderSummary books={books} total={total} wrap={wrapOf(draft.wrap)} arrivalText={isValidPin(draft.pin) ? arrivalText : null} />
      </div>
    </div>
  );
}

function EmptyBasket() {
  return (
    <div className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col p-2.5 sm:p-3">
      <section className="flex flex-1 flex-col items-center justify-center rounded-[36px] bg-[#fffdf8] px-page-inset py-20 text-center sm:rounded-[56px]">
        <p className="-rotate-3 font-[family-name:var(--font-caveat)] text-[28px] leading-none text-[#3b308f] sm:text-[32px]">nothing here yet</p>
        <h1 className="mt-3 max-w-[18ch] type-display">Your gift basket is empty</h1>
        <p className="mt-4 max-w-[44ch] type-body-lg text-[#1d2838]/70">Answer five quick questions about the child and we&apos;ll suggest books to gift.</p>
        <CtaButton href="/gifting/quiz" label="Find a gift for a child" className="mt-8 w-fit" />
      </section>
    </div>
  );
}

function StepCard({
  index,
  title,
  open,
  done,
  summary,
  onEdit,
  children,
}: {
  index: number;
  title: string;
  open: boolean;
  done: boolean;
  summary: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (open && index > 0) headingRef.current?.focus({ preventScroll: false });
  }, [open, index]);

  return (
    <section
      aria-labelledby={`checkout-step-${index}`}
      className={`rounded-[28px] px-page-inset py-6 transition-colors duration-300 sm:rounded-[40px] sm:py-8 ${open ? "bg-[#fffdf8]" : "bg-[#fffdf8]/60"}`}
    >
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className={`grid size-11 shrink-0 place-items-center rounded-[14px] type-button transition-[background-color,rotate] duration-300 ${
            done ? "rotate-[-8deg] bg-[#f26b4f] text-[#1d2838]" : open ? "bg-[#1d2838] text-white" : "bg-[#1d2838]/15 text-[#1d2838]/60"
          }`}
        >
          {done ? (
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5L20 7" />
            </svg>
          ) : (
            index + 1
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={`checkout-step-${index}`} ref={headingRef} tabIndex={-1} className={`type-title outline-none ${open || done ? "" : "text-[#1d2838]/50"}`}>
            {title}
          </h2>
          {done && summary && <p className="mt-1 truncate type-body-sm text-[#1d2838]/70">{summary}</p>}
        </div>
        {done && onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="h-10 shrink-0 rounded-full border-2 border-[#1d2838]/15 px-4 type-label transition-colors hover:border-[#1d2838] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838]"
          >
            Edit
          </button>
        )}
      </div>
      {open && <div className="mt-6 animate-q-in sm:mt-8">{children}</div>}
    </section>
  );
}

function BasketStep({ books, onContinue }: { books: MockBook[]; onContinue: () => void }) {
  return (
    <>
      <ul className="flex flex-col gap-2">
        {books.map((b) => (
          <li key={b.id} className="flex items-center gap-4 rounded-[24px] bg-[#f4eee3] p-3 pr-4">
            <span className="relative size-16 shrink-0 overflow-hidden rounded-[14px]" style={{ backgroundColor: b.tone }}>
              <Image src={b.cover} alt="" fill sizes="64px" className="object-contain p-1.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate type-title-sm">{b.title}</p>
              <p className="truncate type-body-sm text-[#1d2838]/65">by {b.author}</p>
            </div>
            <p className="type-title-sm tabular-nums">{rupeesFmt(b.price)}</p>
            <button
              type="button"
              onClick={() => toggleGift(b.id)}
              aria-label={`Remove ${b.title} from the gift basket`}
              className="grid size-10 shrink-0 place-items-center rounded-full text-[#1d2838]/60 transition-colors hover:bg-[#1d2838]/10 hover:text-[#1d2838] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838]"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/gifting/quiz" className="link-underline type-label focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838]">
          Add more books
        </Link>
        <Button onClick={onContinue} variant="primary" arrow="right">
          Continue
        </Button>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  optional,
  className = "",
  ...input
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  optional?: boolean;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="flex items-baseline gap-2 type-label">
        {label}
        {optional && <span className="font-normal text-[#1d2838]/50">optional</span>}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`mt-2 h-14 w-full rounded-[18px] bg-[#f4eee3] px-5 type-body outline-none placeholder:text-[#1d2838]/35 focus:ring-2 focus:ring-[#1d2838] ${
          error ? "ring-2 ring-[#b3402a]" : ""
        }`}
        {...input}
      />
      {error && (
        <p id={`${id}-error`} className="mt-2 type-body-sm text-[#b3402a]">
          {error}
        </p>
      )}
    </div>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-4 rounded-[24px] bg-[#f4eee3] p-4">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors duration-200 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#1d2838] ${
          checked ? "bg-[#1d2838]" : "bg-[#1d2838]/20"
        }`}
      >
        <span className={`absolute top-1 size-5 rounded-full bg-white transition-[left] duration-200 ${checked ? "left-6" : "left-1"}`} />
      </span>
      <span>
        <span className="block type-label">{label}</span>
        <span className="mt-1 block type-body-sm text-[#1d2838]/65">{hint}</span>
      </span>
    </label>
  );
}

type Update = <K extends keyof CheckoutDraft>(key: K, value: CheckoutDraft[K]) => void;

function RecipientStep({
  draft,
  update,
  errors,
  earliest,
  arrivalText,
  onContinue,
}: {
  draft: CheckoutDraft;
  update: Update;
  errors: Errors;
  earliest: Date;
  arrivalText: string | null;
  onContinue: () => void;
}) {
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onContinue();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Deliver to" autoComplete="shipping name" placeholder="The child's parent or the child" value={draft.recipientName} onChange={(v) => update("recipientName", v)} error={errors.recipientName} />
        <Field label="Their mobile number" type="tel" inputMode="tel" autoComplete="shipping tel" placeholder="10-digit mobile" value={draft.recipientPhone} onChange={(v) => update("recipientPhone", v)} error={errors.recipientPhone} />
        <Field label="House and street" autoComplete="shipping address-line1" value={draft.address1} onChange={(v) => update("address1", v)} error={errors.address1} className="sm:col-span-2" />
        <Field label="Area or landmark" optional autoComplete="shipping address-line2" value={draft.address2} onChange={(v) => update("address2", v)} className="sm:col-span-2" />
        <Field label="City or town" autoComplete="shipping address-level2" value={draft.city} onChange={(v) => update("city", v)} error={errors.city} />
        <Field label="State" autoComplete="shipping address-level1" value={draft.state} onChange={(v) => update("state", v)} error={errors.state} />
        <Field
          label="PIN code"
          inputMode="numeric"
          autoComplete="shipping postal-code"
          maxLength={6}
          value={draft.pin}
          onChange={(v) => update("pin", v.replace(/\D/g, ""))}
          error={errors.pin}
        />
        <div className="flex items-end">
          <p className={`flex h-14 items-center gap-2 type-body-sm ${arrivalText ? "text-[#1d2838]" : "text-[#1d2838]/50"}`}>
            <TruckIcon />
            {arrivalText ?? "Add the PIN code to see delivery dates"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Toggle
          checked={draft.hidePrices}
          onChange={(v) => update("hidePrices", v)}
          label="Hide prices on the packing slip"
          hint="So the gift stays a gift."
        />
        <div className="rounded-[24px] bg-[#f4eee3] p-4">
          <p id="deliver-after-label" className="type-label">
            Deliver on or after <span className="font-normal text-[#1d2838]/50">optional</span>
          </p>
          <p className="mt-1 type-body-sm text-[#1d2838]/65">For a birthday or festival. We&apos;ll hold it until then.</p>
          <DatePicker
            labelledBy="deliver-after-label"
            min={isoDate(earliest)}
            value={draft.deliverAfter}
            onChange={(v) => update("deliverAfter", v)}
            placeholder="As soon as possible"
            className="mt-3"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="submit" variant="primary" arrow="right">
          Continue
        </Button>
      </div>
    </form>
  );
}

function WrapSwatch({ wrap, className = "" }: { wrap: Wrap; className?: string }) {
  return (
    <span
      aria-hidden
      className={`relative block overflow-hidden ${className}`}
      style={{ backgroundColor: wrap.paper, backgroundImage: wrap.pattern, backgroundSize: "22px 22px" }}
    >
      <span className="absolute inset-y-0 left-1/2 w-[14%] -translate-x-1/2" style={{ background: wrap.ribbon }} />
      <span className="absolute inset-x-0 top-1/2 h-[14%] -translate-y-1/2" style={{ background: wrap.ribbon }} />
    </span>
  );
}

function NoteStep({ draft, update, onContinue }: { draft: CheckoutDraft; update: Update; onContinue: () => void }) {
  const noteId = useId();
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
        <div>
          <label htmlFor={noteId} className="flex items-baseline gap-2 type-label">
            Your note <span className="font-normal text-[#1d2838]/50">optional</span>
          </label>
          <textarea
            id={noteId}
            rows={5}
            maxLength={NOTE_MAX}
            value={draft.note}
            onChange={(e) => update("note", e.target.value)}
            placeholder="Happy birthday! I hope these become your favourites."
            className="mt-2 w-full resize-none rounded-[18px] bg-[#f4eee3] px-5 py-4 type-body outline-none placeholder:text-[#1d2838]/35 focus:ring-2 focus:ring-[#1d2838]"
          />
          <p className="mt-1 text-right type-body-sm tabular-nums text-[#1d2838]/50">
            {draft.note.length}/{NOTE_MAX}
          </p>
          <Field label="Signed from" optional placeholder="e.g. Ammamma and Appooppa" value={draft.from} onChange={(v) => update("from", v)} className="mt-2" />
        </div>

        <div aria-hidden className="flex items-center justify-center rounded-[24px] bg-[#f4eee3] p-6">
          <div className="w-full max-w-[320px] rotate-[-2deg] rounded-[14px] bg-[#fffdf8] p-6 shadow-[0_16px_32px_-16px_rgba(29,40,56,0.5)]">
            <p className="min-h-[96px] whitespace-pre-wrap break-words font-[family-name:var(--font-caveat)] text-[26px] leading-[1.15] text-[#1d2838]">
              {draft.note.trim() || "Your note will appear here."}
            </p>
            <p className="mt-4 text-right font-[family-name:var(--font-caveat)] text-[22px] leading-none text-[#1d2838]/70">
              {draft.from.trim() ? `— ${draft.from.trim()}` : ""}
            </p>
          </div>
        </div>
      </div>

      <fieldset className="mt-8">
        <legend className="type-label">Wrapping paper · free</legend>
        <div role="radiogroup" className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
          {WRAPS.map((w) => {
            const selected = draft.wrap === w.value;
            return (
              <button
                key={w.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => update("wrap", w.value)}
                className={`flex flex-col gap-3 rounded-[24px] p-2.5 pb-4 text-left transition-[background-color,scale] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838] active:scale-[0.98] sm:p-3 ${
                  selected ? "bg-[#1d2838] text-white" : "bg-[#f4eee3] hover:bg-[#ece3d3]"
                }`}
              >
                <WrapSwatch wrap={w} className="aspect-[4/3] w-full rounded-[16px]" />
                <span className="px-1 type-label">{w.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6 flex justify-end">
        <Button onClick={onContinue} variant="primary" arrow="right">
          Continue to payment
        </Button>
      </div>
    </>
  );
}

function PaymentStep({
  draft,
  update,
  card,
  setCard,
  errors,
  total,
  paying,
  onPay,
}: {
  draft: CheckoutDraft;
  update: Update;
  card: Card;
  setCard: React.Dispatch<React.SetStateAction<Card>>;
  errors: Errors;
  total: number;
  paying: boolean;
  onPay: () => void;
}) {
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!paying) onPay();
      }}
    >
      <fieldset disabled={paying}>
        <legend className="type-label">Your details, for the receipt and delivery updates</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Field label="Your name" autoComplete="name" value={draft.giverName} onChange={(v) => update("giverName", v)} error={errors.giverName} />
          <Field label="Email" type="email" autoComplete="email" value={draft.giverEmail} onChange={(v) => update("giverEmail", v)} error={errors.giverEmail} />
          <Field label="Mobile" type="tel" inputMode="tel" autoComplete="tel" value={draft.giverPhone} onChange={(v) => update("giverPhone", v)} error={errors.giverPhone} />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-2">
          <p className="type-label">Pay with</p>
          <span className="rounded-full bg-[#ffe75e] px-3 py-1 type-body-sm font-semibold">Demo: no money is taken</span>
        </div>
        <div role="radiogroup" aria-label="Payment method" className="mt-3 flex flex-col gap-2">
          {PAYMENT_METHODS.map((m) => {
            const selected = draft.payment === m.value;
            return (
              <div key={m.value} className={`rounded-[24px] transition-colors ${selected ? "bg-[#f4eee3] ring-2 ring-[#1d2838]" : "bg-[#f4eee3]"}`}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => update("payment", m.value)}
                  className="flex w-full items-center gap-4 rounded-[24px] p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838]"
                >
                  <span aria-hidden className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${selected ? "border-[#1d2838]" : "border-[#1d2838]/30"}`}>
                    {selected && <span className="size-3 rounded-full bg-[#1d2838]" />}
                  </span>
                  <span>
                    <span className="block type-label">{m.label}</span>
                    <span className="block type-body-sm text-[#1d2838]/65">{m.line}</span>
                  </span>
                </button>
                {selected && (
                  <div className="animate-q-in px-4 pb-4">
                    {m.value === "upi" && (
                      <Field label="UPI ID" placeholder="name@bank" autoComplete="off" value={draft.upiId} onChange={(v) => update("upiId", v)} error={errors.upiId} />
                    )}
                    {m.value === "card" && (
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <Field
                          label="Card number"
                          inputMode="numeric"
                          autoComplete="cc-number"
                          placeholder="1234 5678 9012 3456"
                          value={card.number}
                          onChange={(v) => setCard((c) => ({ ...c, number: v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ") }))}
                          error={errors.number}
                          className="col-span-2"
                        />
                        <Field
                          label="Expiry"
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          placeholder="MM/YY"
                          value={card.expiry}
                          onChange={(v) => {
                            const digits = v.replace(/\D/g, "").slice(0, 4);
                            setCard((c) => ({ ...c, expiry: digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits }));
                          }}
                          error={errors.expiry}
                        />
                        <Field
                          label="CVV"
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          type="password"
                          value={card.cvv}
                          onChange={(v) => setCard((c) => ({ ...c, cvv: v.replace(/\D/g, "").slice(0, 3) }))}
                          error={errors.cvv}
                        />
                      </div>
                    )}
                    {m.value === "netbanking" && (
                      <div>
                        <label htmlFor="bank" className="type-label">
                          Your bank
                        </label>
                        <select
                          id="bank"
                          value={draft.bank}
                          onChange={(e) => update("bank", e.target.value)}
                          aria-invalid={errors.bank ? true : undefined}
                          className={`mt-2 h-14 w-full rounded-[18px] bg-[#fffdf8] px-5 type-body outline-none focus:ring-2 focus:ring-[#1d2838] ${errors.bank ? "ring-2 ring-[#b3402a]" : ""}`}
                        >
                          <option value="">Choose a bank</option>
                          {BANKS.map((b) => (
                            <option key={b}>{b}</option>
                          ))}
                        </select>
                        {errors.bank && <p className="mt-2 type-body-sm text-[#b3402a]">{errors.bank}</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 type-body-sm text-[#1d2838]/65">
          <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          Payments will be handled by a secure gateway.
        </p>
        <button
          type="submit"
          disabled={paying}
          aria-live="polite"
          className="flex h-14 items-center justify-center gap-3 rounded-[14px] bg-[#f9a220] px-7 type-button text-black transition-colors hover:bg-[#e8900c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838] disabled:cursor-wait"
        >
          {paying ? (
            <>
              <span aria-hidden className="size-5 animate-spin rounded-full border-[3px] border-black/25 border-t-black motion-reduce:animate-none" />
              Processing payment…
            </>
          ) : (
            <>
              Pay {rupeesFmt(total)}
              <ArrowIcon dir="right" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </svg>
  );
}

function OrderSummary({ books, total, wrap, arrivalText }: { books: MockBook[]; total: number; wrap: Wrap; arrivalText: string | null }) {
  return (
    <aside aria-label="Order summary" className="lg:sticky lg:top-28 lg:self-start">
      <div className="rounded-[28px] bg-[#1d2838] p-6 text-[#fffdf8] sm:rounded-[40px] sm:p-8">
        <div className="flex items-center gap-4">
          <WrapSwatch wrap={wrap} className="size-16 shrink-0 rounded-[14px]" />
          <div>
            <p className="type-title-sm">Order summary</p>
            <p className="type-body-sm text-[#fffdf8]/70">{wrap.label} wrap · card included</p>
          </div>
        </div>

        <ul className="mt-6 flex flex-col gap-3 border-t border-white/15 pt-6">
          {books.map((b) => (
            <li key={b.id} className="flex items-center gap-3">
              <span className="relative size-11 shrink-0 overflow-hidden rounded-[10px]" style={{ backgroundColor: b.tone }}>
                <Image src={b.cover} alt="" fill sizes="44px" className="object-contain p-1" />
              </span>
              <span className="min-w-0 flex-1 truncate type-body-sm">{b.title}</span>
              <span className="type-body-sm tabular-nums">{rupeesFmt(b.price)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-6 flex flex-col gap-2 border-t border-white/15 pt-6 type-body-sm">
          <div className="flex justify-between">
            <dt className="text-[#fffdf8]/70">Books</dt>
            <dd className="tabular-nums">{rupeesFmt(total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#fffdf8]/70">Gift wrapping and card</dt>
            <dd className="text-[#a9dfc0]">Free</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#fffdf8]/70">Delivery</dt>
            <dd className="text-[#a9dfc0]">Free</dd>
          </div>
          <div className="mt-2 flex items-baseline justify-between border-t border-white/15 pt-4">
            <dt className="type-title-sm">Total</dt>
            <dd className="type-title tabular-nums">{rupeesFmt(total)}</dd>
          </div>
        </dl>

        <p className={`mt-6 flex items-center gap-2 rounded-[16px] bg-white/10 px-4 py-3 type-body-sm ${arrivalText ? "" : "text-[#fffdf8]/60"}`}>
          <TruckIcon />
          {arrivalText ?? "Delivery dates appear once you add the PIN code"}
        </p>
      </div>
    </aside>
  );
}
