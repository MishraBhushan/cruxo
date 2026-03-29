"use client";

import { motion } from "framer-motion";
import type { ArgumentCard, SessionResult } from "@/lib/types";

interface ResultsScreenProps {
  question: string;
  result: SessionResult;
  cards: ArgumentCard[];
  onReset: () => void;
}

export function ResultsScreen({
  question,
  result,
  cards,
  onReset,
}: ResultsScreenProps) {
  const supports = cards.filter((c) => c.position === "supports");
  const challenges = cards.filter((c) => c.position === "challenges");
  const total = supports.length + challenges.length;
  const supportPct = total > 0 ? Math.round((supports.length / total) * 100) : 50;

  return (
    <motion.div
      className="mx-auto flex h-dvh w-full max-w-2xl flex-col gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-paper-panel editorial-rule border px-5 py-4 sm:px-8 sm:py-5">
        <p className="m-0 text-[0.72rem] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
          Decision map
        </p>
        <h2 className="font-display mt-2 text-[clamp(1.4rem,4vw,2.4rem)] leading-[0.95] tracking-[-0.05em] text-[var(--color-text)]">
          Here is where your thinking landed.
        </h2>
        <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)] sm:text-sm">
          {question}
        </p>
      </div>

      {/* Lean bar */}
      <div className="bg-paper-panel editorial-rule border px-5 py-3 sm:p-4">
        <div className="mb-2 flex justify-between text-xs font-medium">
          <span className="text-[var(--color-challenge)]">Challenge {100 - supportPct}%</span>
          <span className="text-[var(--color-support)]">Support {supportPct}%</span>
        </div>
        <div className="h-2 overflow-hidden bg-[rgba(23,20,16,0.08)]">
          <motion.div
            className="h-full bg-gradient-to-r from-[var(--color-challenge)] via-[rgba(23,20,16,0.35)] to-[var(--color-support)]"
            initial={{ width: "50%" }}
            animate={{ width: `${supportPct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Three results in a row on desktop, stacked on mobile — all compact */}
      <div className="grid flex-1 gap-2 sm:grid-cols-3 sm:gap-3">
        {/* Blind spot */}
        <motion.div
          className="border border-[var(--color-challenge)]/22 bg-[rgba(143,35,31,0.05)] p-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="mb-1.5 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[var(--color-challenge)]">
            Blind Spot
          </h3>
          <p className="text-sm leading-6 text-[var(--color-text)]">
            {result.blindSpot}
          </p>
        </motion.div>

        {/* The Crux */}
        <motion.div
          className="bg-[var(--color-text)] p-4 text-[var(--color-bg)]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="mb-1.5 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[rgba(243,239,230,0.62)]">
            The Crux
          </h3>
          <p className="font-display text-[clamp(1.1rem,3vw,1.6rem)] leading-[1.15] tracking-[-0.03em]">
            {result.crux}
          </p>
        </motion.div>

        {/* Next step */}
        <motion.div
          className="bg-paper-panel editorial-rule border p-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className="mb-1.5 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            Next Step
          </h3>
          <p className="text-sm leading-6 text-[var(--color-text)]">
            {result.nextStep}
          </p>
        </motion.div>
      </div>

      {/* Bottom actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onReset}
          className="flex-1 border border-[var(--color-text)] bg-[var(--color-text)] px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-bg)] transition hover:opacity-90"
        >
          Try Another Decision
        </button>
        <div className="flex gap-2">
          <p className="text-[0.68rem] text-[var(--color-text-muted)]">Helpful?</p>
          <button className="border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium transition hover:bg-[rgba(255,255,255,0.55)]">
            Yes
          </button>
          <button className="border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium transition hover:bg-[rgba(255,255,255,0.55)]">
            No
          </button>
        </div>
      </div>
    </motion.div>
  );
}
