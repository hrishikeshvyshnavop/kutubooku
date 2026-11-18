"use client";

import { useSyncExternalStore } from "react";
import type { GiftOrder } from "../_data/gift-checkout";

const KEY = "kb:gift-orders";
const EMPTY: GiftOrder[] = [];

let cache: GiftOrder[] | null = null;
const listeners = new Set<() => void>();

function read(): GiftOrder[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useGiftOrders(): GiftOrder[] | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function saveGiftOrder(order: GiftOrder) {
  cache = [order, ...read().filter((o) => o.id !== order.id)];
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {}
  listeners.forEach((l) => l());
}

export function newOrderId() {
  return `KBG-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}
