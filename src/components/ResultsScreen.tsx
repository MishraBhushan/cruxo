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
      className="w-full max-w-md mx-auto px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Your Decision Map
        </h2>
        <p className="text-sm text-gray-500">{question}</p>
      </div>

      {/* Lean bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4 shadow-sm">
        <div className="flex justify-between text-sm font-medium mb-2">
          <span className="text-red-600">Challenge {100 - supportPct}%</span>
          <span className="text-green-600">Support {supportPct}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-red-500 via-gray-300 to-green-500 rounded-full"
            initial={{ width: "50%" }}
            animate={{ width: `${supportPct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <p className="text-center text-sm text-gray-500 mt-2">
          {result.leanDirection === "balanced"
            ? "Genuinely torn"
            : `Leaning ${supportPct}% toward ${result.leanDirection === "supports" ? "doing it" : "not doing it"}`}
        </p>
      </div>

      {/* Blind spot */}
      <motion.div
        className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-sm font-bold text-red-800 uppercase tracking-wide mb-2">
          Blind Spot
        </h3>
        <p className="text-base text-red-900 leading-relaxed">
          {result.blindSpot}
        </p>
      </motion.div>

      {/* The Crux */}
      <motion.div
        className="bg-gray-900 text-white rounded-2xl p-5 mb-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">
          The Crux
        </h3>
        <p className="text-lg font-semibold leading-relaxed">{result.crux}</p>
      </motion.div>

      {/* Next Step */}
      <motion.div
        className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
          Next Step
        </h3>
        <p className="text-base text-gray-900 leading-relaxed">
          {result.nextStep}
        </p>
      </motion.div>

      {/* Actions */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={onReset}
          className="flex-1 py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
        >
          Try Another Decision
        </button>
      </div>

      {/* Feedback */}
      <div className="text-center pb-8">
        <p className="text-sm text-gray-500 mb-3">
          Did this surface something you hadn&apos;t considered?
        </p>
        <div className="flex justify-center gap-3">
          <button className="px-6 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors">
            Yes
          </button>
          <button className="px-6 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors">
            No
          </button>
        </div>
      </div>

      {/* Branding */}
      <p className="text-center text-xs text-gray-400 pb-6">
        cruxo.ai — the app that argues back
      </p>
    </motion.div>
  );
}
