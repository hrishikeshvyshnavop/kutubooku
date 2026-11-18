import { ViewTransition } from "react";

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition name="page" share="page-swap" enter="page-in" default="none">
      {children}
    </ViewTransition>
  );
}
