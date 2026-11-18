import { MOCK_BOOKS, type MockBook } from "./curation-mock";

export type Wrap = { value: string; label: string; paper: string; ribbon: string; pattern: string };

export const WRAPS: Wrap[] = [
  {
    value: "sunshine",
    label: "Sunshine",
    paper: "#f9a220",
    ribbon: "#3b308f",
    pattern: "radial-gradient(circle at 25% 25%, rgb(255 255 255 / 0.55) 0 3px, transparent 4px), radial-gradient(circle at 75% 75%, rgb(255 255 255 / 0.55) 0 3px, transparent 4px)",
  },
  {
    value: "starry-night",
    label: "Starry night",
    paper: "#1d2838",
    ribbon: "#f9a220",
    pattern: "radial-gradient(circle at 20% 30%, #ffe75e 0 1.5px, transparent 2.5px), radial-gradient(circle at 70% 70%, #fffdf8 0 1px, transparent 2px)",
  },
  {
    value: "garden",
    label: "Garden",
    paper: "#a9dfc0",
    ribbon: "#f26b4f",
    pattern: "repeating-linear-gradient(45deg, rgb(255 255 255 / 0.4) 0 6px, transparent 6px 16px)",
  },
];

export const wrapOf = (value: string) => WRAPS.find((w) => w.value === value) ?? WRAPS[0];

export type PaymentMethod = "upi" | "card" | "netbanking";

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; line: string }[] = [
  { value: "upi", label: "UPI", line: "Google Pay, PhonePe, Paytm or any UPI app" },
  { value: "card", label: "Credit or debit card", line: "Visa, Mastercard, RuPay" },
  { value: "netbanking", label: "Netbanking", line: "All major Indian banks" },
];

export const BANKS = ["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra Bank", "Other bank"];

const METRO_PIN_PREFIXES = ["11", "40", "56", "60", "70", "50", "41", "38"];
const SLOW_SOURCING = new Set(["the-heart-and-the-bottle", "after-the-fall", "the-invisible-boy"]);

export const isValidPin = (pin: string) => /^[1-9]\d{5}$/.test(pin.trim());
export const isValidPhone = (phone: string) => /^(\+?91)?[6-9]\d{9}$/.test(phone.replace(/[\s-]/g, ""));
export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export function deliveryDays(pin: string, bookIds: string[]): [number, number] {
  const metro = isValidPin(pin) && METRO_PIN_PREFIXES.some((p) => pin.trim().startsWith(p));
  const base: [number, number] = metro ? [3, 5] : [5, 7];
  const slow = bookIds.some((id) => SLOW_SOURCING.has(id)) ? 3 : 0;
  return [base[0] + slow, base[1] + slow];
}

export const addDays = (from: Date, days: number) => {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
};

export const shortDate = (d: Date | string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const BY_ID = new Map(MOCK_BOOKS.map((b) => [b.id, b]));
export const giftBook = (id: string): MockBook | undefined => BY_ID.get(id);

export const NOTE_MAX = 240;

export type CheckoutDraft = {
  recipientName: string;
  recipientPhone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  pin: string;
  hidePrices: boolean;
  deliverAfter: string;
  note: string;
  from: string;
  wrap: string;
  giverName: string;
  giverEmail: string;
  giverPhone: string;
  payment: PaymentMethod;
  upiId: string;
  bank: string;
};

export const EMPTY_DRAFT: CheckoutDraft = {
  recipientName: "",
  recipientPhone: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  pin: "",
  hidePrices: true,
  deliverAfter: "",
  note: "",
  from: "",
  wrap: WRAPS[0].value,
  giverName: "",
  giverEmail: "",
  giverPhone: "",
  payment: "upi",
  upiId: "",
  bank: "",
};

export type GiftOrderItem = { bookId: string; title: string; author: string; cover: string; price: number };

export type GiftOrder = {
  id: string;
  placedAt: string;
  items: GiftOrderItem[];
  total: number;
  recipient: { name: string; phone: string; address: string; pin: string };
  giver: { name: string; email: string; phone: string };
  note: string;
  from: string;
  wrap: string;
  hidePrices: boolean;
  deliverAfter: string;
  payment: PaymentMethod;
  arrives: [string, string];
};

export const ORDER_STAGES = ["Paid", "Wrapping", "Shipped", "Delivered"] as const;

const DAY_MS = 86_400_000;

export function stageOf(order: GiftOrder, now: Date): number {
  const placed = new Date(order.placedAt);
  const daysSincePlaced = Math.floor((now.getTime() - placed.getTime()) / DAY_MS);
  const arrivesFrom = new Date(`${order.arrives[0]}T00:00:00`);
  if (now >= arrivesFrom) return 3;
  if (order.deliverAfter && now < new Date(new Date(`${order.deliverAfter}T00:00:00`).getTime() - 3 * DAY_MS)) return 1;
  return daysSincePlaced >= 1 ? 2 : 1;
}

export const arrivalLabel = (order: GiftOrder, delivered: boolean) =>
  delivered
    ? `Delivered by ${shortDate(order.arrives[1])}`
    : order.deliverAfter
      ? `Arrives on or after ${shortDate(order.deliverAfter)}`
      : `Arrives ${shortDate(order.arrives[0])}–${shortDate(order.arrives[1])}`;
