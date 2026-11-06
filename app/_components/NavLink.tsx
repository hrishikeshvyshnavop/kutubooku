"use client";

// Nav link that also handles in-page sections ("/#faq"). Used by the header and footer.
// - Already on the page that holds the section: no navigation, the page glides to it
//   (through Lenis, so it matches the site's smooth scroll) and the URL gets the #hash.
// - From any other page: a normal link; Next opens the page at the section.
// "/" and "/home" are the same page (home), so "/#faq" glides on either.

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
        // Next frame: lets a closing menu release the page scroll first.
        requestAnimationFrame(() => {
          const top = el.getBoundingClientRect().top + window.scrollY;
          pageScroll.to(top); // smooth native scroll; instant with reduced motion
          // Keyboard users land in the section too.
          el.focus({ preventScroll: true });
        });
      }}
    />
  );
}
