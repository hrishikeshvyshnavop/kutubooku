"use client";

import { useEffect, useRef, useState } from "react";
import { MOCK_BOOKS } from "../_data/curation-mock";
import { toggleInBox, useBox } from "../_lib/box";
import { activeOf, displayName, readFor, useChildren } from "../_lib/children";
import { flyToBox } from "../_lib/fly";
import type { BookCardBox } from "./book/BookCard";
import { useSession } from "../_lib/session";
import { Toast, type ToastData } from "./ui/Toast";

export function useAddToBox() {
  const session = useSession();
  const kids = useChildren();
  const box = useBox();
  const [toast, setToast] = useState<ToastData | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const ready = session !== undefined && kids !== null;
  const active = session ? activeOf(kids) : null;
  const saved = ready ? readFor() : undefined;
  const child = !ready ? null : saved !== undefined ? saved : active ? displayName(active.name) : null;
  const whoseBox = child ? `${child}'s box` : "your box";
  const inBox = new Set((box?.items ?? []).filter((i) => i.child === child).map((i) => i.bookId));

  const toggle = (id: string) => {
    const book = MOCK_BOOKS.find((b) => b.id === id);
    if (!book) return;
    const added = toggleInBox(id, child, "book");
    if (added) flyToBox({ bookId: id, cover: book.cover });
    setToast((t) => ({
      text: `${added ? "Added" : "Took"} “${book.title}” ${added ? "to" : "out of"} ${whoseBox}.`,
      n: (t?.n ?? 0) + 1,
      tone: added ? "done" : "info",
      action: added ? { label: "View box", href: "/box" } : undefined,
    }));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3200);
  };

  const toastEl = <Toast toast={toast} />;

  const cardProps = (id: string): Required<BookCardBox> => ({ child, selected: inBox.has(id), onToggle: () => toggle(id) });

  return { child, whoseBox, cardProps, toastEl };
}
