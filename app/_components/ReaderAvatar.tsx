"use client";

// A child's profile picture: the book character they picked (app/_data/avatars.ts),
// or their initial on a colour while they haven't got one.

import Image from "next/image";
import { avatarById, avatarSrc } from "../_data/avatars";
import { displayName, type ChildAnswers } from "../_lib/children";

/** Each reader keeps the same colour (by position) for the initial fallback. */
export const READER_COLOURS = ["#f6c453", "#9fcbf2", "#a9dfc0", "#f7ab95", "#c9b7f1", "#d8e88a"];

export function ReaderAvatar({
  child,
  index = 0,
  size = 120,
  round = false,
}: {
  child: { name: string; answers: ChildAnswers };
  index?: number;
  size?: number;
  /** Circle (chips) instead of the rounded square (picker, menu). */
  round?: boolean;
}) {
  const av = avatarById(child.answers.avatar);
  const shape = round ? "rounded-full" : "rounded-[28%]";
  if (av) {
    return (
      <Image
        src={avatarSrc(av.id)}
        alt=""
        aria-hidden
        width={256}
        height={256}
        sizes={`${size * 2}px`}
        draggable={false}
        // Small files: load straight away (also inside closed menus), so switching child never flashes empty.
        loading="eager"
        style={{ width: size, height: size }}
        className={`shrink-0 select-none object-cover ${shape}`}
      />
    );
  }
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.42, backgroundColor: READER_COLOURS[index % READER_COLOURS.length] }}
      className={`grid shrink-0 place-items-center font-bold leading-none text-[#1d2838] ${shape}`}
    >
      {displayName(child.name).charAt(0)}
    </span>
  );
}
