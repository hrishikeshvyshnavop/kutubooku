"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { BOOKS } from "./Book3D";
import { MascotVideo } from "./MascotVideo";

const HANDOFF_MS = 7040;
const EXIT_MS = 500;

const SKIP_SCRIPT = `try{if(matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("kb-intro-skip")}catch(e){}`;

let startedThisLoad = false;

const COVERS = BOOKS.slice(0, 3).map((b) => b.src);
const CHIPS = ["Space", "Dinosaurs", "Bedtime"];
const BEATS = ["Tell us about your child", "We pick books just for them", "Delivered via Amazon"];

export function Intro() {
  const [phase, setPhase] = useState<"play" | "exit" | "gone">(() => (startedThisLoad ? "gone" : "play"));
  const boxRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const startedGone = useRef(phase === "gone");

  useEffect(() => {
    if (startedGone.current) return;
    startedThisLoad = true;
    if (document.documentElement.classList.contains("kb-intro-skip")) {
      setPhase("gone"); // eslint-disable-line react-hooks/set-state-in-effect -- reduced motion, decided before paint
      return;
    }
    const toExit = () => setPhase((p) => (p === "play" ? "exit" : p));
    const elapsed = Number(document.timeline?.currentTime ?? 0);
    const t = setTimeout(toExit, Math.max(0, HANDOFF_MS - elapsed));
    window.addEventListener("keydown", toExit, { once: true });
    const root = rootRef.current;
    const onScrollGesture = (e: Event) => {
      e.preventDefault();
      toExit();
    };
    root?.addEventListener("wheel", onScrollGesture, { passive: false });
    root?.addEventListener("touchmove", onScrollGesture, { passive: false });
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", toExit);
      root?.removeEventListener("wheel", onScrollGesture);
      root?.removeEventListener("touchmove", onScrollGesture);
    };
  }, []);

  useEffect(() => {
    if (phase !== "exit") return;
    const r = boxRef.current?.getBoundingClientRect();
    window.dispatchEvent(
      new CustomEvent("kb:intro-done", { detail: r ? { x: r.left + r.width / 2, y: r.top + r.height * 0.3 } : null }),
    );
    const t = setTimeout(() => setPhase("gone"), EXIT_MS);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SKIP_SCRIPT }} />
      <div
        ref={rootRef}
        role="dialog"
        aria-label="What KutuBooku does"
        onClick={() => setPhase("exit")}
        className={`home-intro fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#FDDAA6] px-6 text-[#1d2838] transition-opacity duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          phase === "exit" ? "is-exit pointer-events-none opacity-0" : ""
        }`}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgb(255_255_255/0.55),transparent_60%)]" />

        <div className="hi-brand relative flex items-center gap-1.5">
          <MascotVideo name="kutu-logo-mark" poster="/brand/mascot/kutu-logo-mark.webp" width={124} height={168} play="always" className="h-[60px] w-auto" />
          <Image src="/brand/kutubooku-logo-deep.svg" alt="kutubooku" width={1674} height={275} priority className="h-auto w-[168px]" />
        </div>

        <div aria-hidden className="relative mt-8 h-[230px] w-[min(420px,100%)] sm:mt-14 sm:h-[260px] sm:scale-[1.15] lg:mt-16 lg:scale-[1.3]">
          <div className="hi-card absolute left-1/2 top-6 w-[260px] -translate-x-1/2 rounded-[24px] bg-white p-4 shadow-[0_24px_50px_-24px_rgba(29,40,56,0.5)]">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-full bg-[#b6beff] text-xl font-bold">M</span>
              <div>
                <p className="font-heading text-xl leading-none">Meera</p>
                <p className="mt-1 text-[14px] text-[#1d2838]/60">5 years old</p>
              </div>
            </div>
            <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#1d2838]/45">Loves</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CHIPS.map((c, i) => (
                <span key={c} className="hi-chip rounded-full bg-[#ffe75e] px-3 py-1 text-[14px] font-semibold" style={{ animationDelay: `${1216 + i * 240}ms` }}>
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div ref={boxRef} className="hi-box absolute bottom-0 left-1/2 h-[118px] w-[190px] -translate-x-1/2">
            <span className="absolute inset-x-0 top-0 h-6 rounded-t-[6px] bg-[#b98247]" />
            <span className="hi-flap-l absolute left-0 top-0 h-[14px] w-1/2 origin-bottom-left rounded-[4px] bg-[#c99257]" />
            <span className="hi-flap-r absolute right-0 top-0 h-[14px] w-1/2 origin-bottom-right rounded-[4px] bg-[#c99257]" />
          </div>

          <div className="absolute inset-x-0 top-2 flex justify-center">
            {COVERS.map((src, i) => (
              <span
                key={src}
                className="hi-cover absolute aspect-[3/4] w-[96px] overflow-hidden rounded-r-[8px] rounded-l-[3px] bg-white shadow-[0_18px_30px_-14px_rgba(29,40,56,0.55)] sm:w-[108px]"
                style={{ "--i": i - 1, animationDelay: `${2336 + i * 224}ms` } as React.CSSProperties}
              >
                <Image src={src} alt="" fill sizes="108px" className="object-cover" />
              </span>
            ))}
          </div>

          <div className="hi-box-front absolute bottom-0 left-1/2 h-[94px] w-[190px] -translate-x-1/2 rounded-b-[10px] rounded-t-[3px] bg-[#d9a35f] shadow-[0_24px_40px_-24px_rgba(29,40,56,0.6)]">
            <span className="absolute inset-x-[42%] inset-y-0 bg-[#e8bf86]" />
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-[#1d2838] px-2.5 py-1 text-[11px] font-bold tracking-[0.04em] text-[#FDDAA6]">kutubooku</span>
          </div>
        </div>

        <p className="relative mt-8 grid h-[1.2em] sm:mt-14 lg:mt-20 w-full place-items-center overflow-hidden text-center font-heading text-[clamp(28px,5vw,44px)] leading-[1.2] tracking-[-0.02em] sm:mt-10">
          {BEATS.map((b, i) => (
            <span key={b} className={`hi-line hi-line-${i + 1} col-start-1 row-start-1 whitespace-nowrap`}>
              {b}
            </span>
          ))}
        </p>
        <div aria-hidden className="mt-5 flex gap-2">
          {[1, 2, 3].map((n) => (
            <span key={n} className={`hi-dot hi-dot-${n} h-2 w-2 rounded-full bg-[#1d2838]`} />
          ))}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setPhase("exit");
          }}
          className="absolute bottom-6 right-6 h-11 rounded-full bg-white/85 px-5 text-[15px] font-semibold text-[#1d2838] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838]"
        >
          Skip intro
        </button>
      </div>
    </>
  );
}
