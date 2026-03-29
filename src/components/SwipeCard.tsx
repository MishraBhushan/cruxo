"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useDrag } from "@use-gesture/react";
import { AutoFitText } from "@/components/AutoFitText";
import type { ArgumentCard, CardPosition } from "@/lib/types";

const SWIPE_THRESHOLD = 100;
const CATEGORY_COLORS: Record<string, string> = {
  financial: "bg-emerald-100 text-emerald-800",
  emotional: "bg-purple-100 text-purple-800",
  practical: "bg-blue-100 text-blue-800",
  social: "bg-pink-100 text-pink-800",
  health: "bg-red-100 text-red-800",
  career: "bg-amber-100 text-amber-800",
  legal: "bg-slate-100 text-slate-800",
  other: "bg-gray-100 text-gray-800",
};

interface SwipeCardProps {
  card: ArgumentCard;
  onSwipe: (position: CardPosition, sortTimeMs: number) => void;
  isActive: boolean;
  showHint?: boolean;
}

export function SwipeCard({ card, onSwipe, isActive, showHint = false }: SwipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const swipeStartTime = useRef(0);
  const [swiping, setSwiping] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const challengeOpacity = useTransform(x, [-SWIPE_THRESHOLD, -20], [1, 0]);
  const supportOpacity = useTransform(x, [20, SWIPE_THRESHOLD], [0, 1]);

  const bind = useDrag(
    ({ active, movement: [mx], velocity: [vx], direction: [dx] }) => {
      if (!isActive) return;

      if (active) {
        setSwiping(true);
        x.set(mx);
      } else {
        setSwiping(false);
        const shouldSwipe =
          Math.abs(mx) > SWIPE_THRESHOLD || Math.abs(vx) > 0.5;

        if (shouldSwipe) {
          const direction = mx > 0 ? 1 : -1;
          const flyOut = direction * 500;

          animate(x, flyOut, {
            type: "spring",
            stiffness: 300,
            damping: 30,
            onComplete: () => {
              const sortTimeMs = Date.now() - swipeStartTime.current;
              const position: CardPosition =
                direction > 0 ? "supports" : "challenges";
              onSwipe(position, sortTimeMs);
            },
          });
        } else {
          animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
        }
      }
    },
    { axis: "x", filterTaps: true }
  );

  useEffect(() => {
    if (!isActive) {
      return;
    }

    swipeStartTime.current = Date.now();
    x.set(0);
  }, [isActive, x]);

  const sourceLabel =
    card.source === "pushback" ? "Counter-argument" : "AI-generated";
  const sourceStyle =
    card.source === "pushback"
      ? "bg-amber-100 text-amber-800"
      : "bg-gray-100 text-gray-600";

  // Separate gesture handlers to avoid event type conflicts with framer-motion
  const gestureHandlers = bind();
  const { onDrag: _onDrag, onDragStart: _onDragStart, onDragEnd: _onDragEnd, ...safeHandlers } = gestureHandlers as Record<string, unknown>;

  return (
    <motion.div
      ref={cardRef}
      {...safeHandlers}
      style={{ x, rotate, touchAction: "none" }}
      className={`
        absolute inset-0
        border border-[var(--color-border)] bg-[rgba(255,255,255,0.72)]
        shadow-[0_20px_60px_rgba(20,17,12,0.10)]
        p-5 sm:p-7 cursor-grab active:cursor-grabbing
        select-none
        ${isActive ? "z-10" : "z-0 pointer-events-none opacity-0"}
      `}
      initial={{ scale: 0.95, opacity: 0, y: 20 }}
      animate={isActive ? { scale: 1, opacity: 1, y: 0 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] ${CATEGORY_COLORS[card.category] ?? CATEGORY_COLORS.other}`}
            >
              {card.category}
            </span>
            <span
              className={`px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] ${sourceStyle}`}
            >
              {sourceLabel}
            </span>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto pr-1">
          <AutoFitText
            text={card.text}
            minFontSize={22}
            maxFontSize={40}
            lineHeightRatio={1.08}
            className="font-medium tracking-[-0.03em] text-[var(--color-text)]"
          />
        </div>

        <div className="grid gap-4 border-t border-[var(--color-border)] pt-4">
          <div className="flex items-center justify-between text-sm font-semibold">
            <motion.span
              className="flex items-center gap-1 text-[var(--color-challenge)]"
              animate={{ opacity: swiping ? undefined : 0.56 }}
              style={swiping ? { opacity: challengeOpacity } : undefined}
            >
              ← Challenge
            </motion.span>
            <motion.span
              className="flex items-center gap-1 text-[var(--color-support)]"
              animate={{ opacity: swiping ? undefined : 0.56 }}
              style={swiping ? { opacity: supportOpacity } : undefined}
            >
              Support →
            </motion.span>
          </div>

          {showHint && isActive && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: [0, 0.7, 0], x: [0, 15, -15, 0] }}
              transition={{ duration: 2.5, repeat: 2, ease: "easeInOut" }}
            >
              <span className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Swipe or tap below
              </span>
            </motion.div>
          )}

          {isActive && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  const sortTimeMs = Date.now() - swipeStartTime.current;
                  onSwipe("challenges", sortTimeMs);
                }}
                className="min-h-12 border border-[var(--color-challenge)]/25 bg-[rgba(143,35,31,0.04)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-challenge)] transition hover:bg-[rgba(143,35,31,0.08)]"
                aria-label="Sort to challenges"
              >
                Challenge
              </button>
              <button
                onClick={() => {
                  const sortTimeMs = Date.now() - swipeStartTime.current;
                  onSwipe("supports", sortTimeMs);
                }}
                className="min-h-12 border border-[var(--color-support)]/25 bg-[rgba(29,91,63,0.04)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-support)] transition hover:bg-[rgba(29,91,63,0.08)]"
                aria-label="Sort to supports"
              >
                Support
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
