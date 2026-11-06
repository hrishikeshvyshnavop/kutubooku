import { ViewTransition } from "react";

/**
 * Page-to-page transition. Wrap the root of every page.tsx (not the layout:
 * layouts persist, so they never enter or exit).
 *
 * Every page uses the same name, so on navigation the old and new page pair up
 * ("page-swap" in globals.css): the new page splashes out from where you clicked
 * over the old one, which stays underneath until covered, so pages with
 * different backgrounds never flash through to the body. If the new page isn't ready in the same commit,
 * it plays "page-in" on its own instead.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition name="page" share="page-swap" enter="page-in" default="none">
      {children}
    </ViewTransition>
  );
}
