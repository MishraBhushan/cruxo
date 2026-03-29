"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useDrag } from "@use-gesture/react";
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
  const swipeStartTime = useRef(Date.now());
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

  // Reset timer when card becomes active
  if (isActive && swipeStartTime.current === 0) {
    swipeStartTime.current = Date.now();
  }

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
        absolute inset-x-4 top-0
        bg-white rounded-2xl border border-gray-200 shadow-lg
        p-6 cursor-grab active:cursor-grabbing
        select-none
        ${isActive ? "z-10" : "z-0 pointer-events-none opacity-0"}
      `}
      initial={{ scale: 0.95, opacity: 0, y: 20 }}
      animate={isActive ? { scale: 1, opacity: 1, y: 0 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* Category + source chips */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[card.category] ?? CATEGORY_COLORS.other}`}
        >
          {card.category}
        </span>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium ${sourceStyle}`}
        >
          {sourceLabel}
        </span>
      </div>

      {/* Argument text */}
      <p className="text-lg leading-relaxed text-gray-900 font-medium">
        {card.text}
      </p>

      {/* Swipe labels — always visible */}
      <div className="flex justify-between items-center mt-6 text-sm font-semibold">
        <motion.span
          className="text-[var(--color-challenge)] flex items-center gap-1"
          animate={{ opacity: swiping ? undefined : 0.5 }}
          style={swiping ? { opacity: challengeOpacity } : undefined}
        >
          ← Challenge
        </motion.span>
        <motion.span
          className="text-[var(--color-support)] flex items-center gap-1"
          animate={{ opacity: swiping ? undefined : 0.5 }}
          style={swiping ? { opacity: supportOpacity } : undefined}
        >
          Support →
        </motion.span>
      </div>

      {/* Swipe hint — only on first card */}
      {showHint && isActive && (
        <motion.div
          className="mt-3 text-center"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: [0, 0.7, 0], x: [0, 15, -15, 0] }}
          transition={{ duration: 2.5, repeat: 2, ease: "easeInOut" }}
        >
          <span className="text-xs tracking-[0.15em] uppercase text-[var(--color-text-muted)]">
            ← swipe to sort →
          </span>
        </motion.div>
      )}

      {/* Keyboard fallback buttons */}
      {isActive && (
        <div className="flex gap-3 mt-4 sm:hidden">
          <button
            onClick={() => {
              const sortTimeMs = Date.now() - swipeStartTime.current;
              onSwipe("challenges", sortTimeMs);
            }}
            className="flex-1 py-2.5 rounded-xl border-2 border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors"
            aria-label="Sort to challenges"
          >
            Challenge
          </button>
          <button
            onClick={() => {
              const sortTimeMs = Date.now() - swipeStartTime.current;
              onSwipe("supports", sortTimeMs);
            }}
            className="flex-1 py-2.5 rounded-xl border-2 border-green-200 text-green-600 font-semibold text-sm hover:bg-green-50 transition-colors"
            aria-label="Sort to supports"
          >
            Support
          </button>
        </div>
      )}
    </motion.div>
  );
}
