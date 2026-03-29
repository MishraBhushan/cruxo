"use client";

import { motion } from "framer-motion";
import type { PushbackData } from "@/lib/types";

interface PushbackScreenProps {
  data: PushbackData;
  onContinue: () => void;
}

export function PushbackScreen({ data, onContinue }: PushbackScreenProps) {
  return (
    <motion.div
      className="z-20"
      initial={{ scale: 0.9, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="border border-[var(--color-pushback)]/30 bg-[rgba(142,93,29,0.08)] p-5 shadow-[0_20px_50px_rgba(20,17,12,0.08)] sm:p-7">
        <div className="mb-5 flex items-center gap-3">
          <span className="text-2xl text-[var(--color-pushback)]">&#9889;</span>
          <h3 className="font-display text-4xl leading-none tracking-[-0.05em] text-[var(--color-text)]">
            Hold on.
          </h3>
        </div>

        <p className="mb-4 text-base leading-7 text-[var(--color-text)] sm:text-lg sm:leading-8">
          {data.message}
        </p>

        <div className="my-5 border-t border-[var(--color-pushback)]/20" />

        <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Here&apos;s what you&apos;re missing
        </p>
        <p className="text-base leading-7 text-[var(--color-text)]">
          {data.card.text}
        </p>

        <button
          onClick={onContinue}
          className="mt-8 w-full border border-[var(--color-text)] bg-[var(--color-text)] px-4 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-bg)] transition hover:opacity-90"
        >
          I hear you. Continue sorting.
        </button>
      </div>
    </motion.div>
  );
}
