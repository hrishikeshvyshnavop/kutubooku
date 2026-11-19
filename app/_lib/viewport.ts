let probe: HTMLDivElement | null = null;

export function stableVh(): number {
  if (!probe || !probe.isConnected) {
    probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = "position:fixed;top:0;left:0;width:0;height:100vh;height:100svh;visibility:hidden;pointer-events:none;";
    document.body.appendChild(probe);
  }
  return probe.offsetHeight || window.innerHeight;
}
