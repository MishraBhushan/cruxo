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
      className="absolute inset-x-4 top-0 z-20"
      initial={{ scale: 0.9, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">&#9889;</span>
          <h3 className="text-lg font-bold text-amber-900">HOLD ON</h3>
        </div>

        {/* Pushback message */}
        <p className="text-base leading-relaxed text-amber-900 font-medium mb-6">
          {data.message}
        </p>

        {/* Divider */}
        <div className="border-t border-amber-200 my-4" />

        {/* Counter-argument preview */}
        <p className="text-sm text-amber-800 font-semibold mb-2">
          Here&apos;s what you&apos;re missing:
        </p>
        <p className="text-base text-gray-900 leading-relaxed">
          {data.card.text}
        </p>

        {/* Continue button */}
        <button
          onClick={onContinue}
          className="mt-6 w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
        >
          I hear you. Continue sorting.
        </button>
      </div>
    </motion.div>
  );
}
