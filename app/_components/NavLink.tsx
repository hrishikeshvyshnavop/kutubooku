"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { pageScroll } from "./SmoothScroll";

const samePage = (a: string, b: string) => {
  const norm = (p: string) => (p === "/home" ? "/" : p.replace(/\/$/, "") || "/");
  return norm(a) === norm(b);
};

export function NavLink({ href, onClick, ...props }: React.ComponentProps<typeof Link> & { href: string }) {
  const pathname = usePathname();
  const [path, hash] = href.split("#");

  return (
    <Link
      href={href}
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (!hash || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        if (!samePage(path || pathname, pathname)) return;
        const el = document.getElementById(hash);
        if (!el) return;
        e.preventDefault();
        history.replaceState(history.state, "", `#${hash}`);
        requestAnimationFrame(() => {
          const top = el.getBoundingClientRect().top + window.scrollY;
          pageScroll.to(top);
          el.focus({ preventScroll: true });
        });
      }}
    />
  );
}
