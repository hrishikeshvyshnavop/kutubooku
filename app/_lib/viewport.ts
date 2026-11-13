// Stable viewport height for layout (2026-11-13).
// On phones the browser's address bar shows on scroll up and hides on scroll down, which changes
// window.innerHeight / 100dvh by ~60–100px. Anything that sizes layout from those (sticky
// sections, pinned-scroll section heights) then grows or shrinks mid-scroll and the page jumps.
// 100svh (the small viewport: address bar shown) never changes with the bar, so layout sized from
// it stays put. Use this for layout; innerHeight is still fine for purely visual effects.

let probe: HTMLDivElement | null = null;

/** Height of 100svh in px (falls back to innerHeight where svh isn't supported). */
export function stableVh(): number {
  if (!probe || !probe.isConnected) {
    probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = "position:fixed;top:0;left:0;width:0;height:100vh;height:100svh;visibility:hidden;pointer-events:none;";
    document.body.appendChild(probe);
  }
  return probe.offsetHeight || window.innerHeight;
}
