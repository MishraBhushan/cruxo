"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CruxoWordmark } from "@/components/brand/CruxoWordmark";
import { SwipeCard } from "@/components/SwipeCard";
import { PushbackScreen } from "@/components/PushbackScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import {
  generateCards,
  generatePushback,
  generateResults,
} from "@/actions/generate";
import { analyzeBias, shouldShowPushback } from "@/lib/session";
import { SAMPLE_DECISIONS } from "@/lib/samples";
import { PretextCloud } from "@/components/PretextCloud";
import type {
  ArgumentCard,
  CardPosition,
  PushbackData,
  SessionResult,
  SessionPhase,
} from "@/lib/types";

export default function Home() {
  const [phase, setPhase] = useState<SessionPhase>("input");
  const [question, setQuestion] = useState("");
  const [cards, setCards] = useState<ArgumentCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pushbackData, setPushbackData] = useState<PushbackData | null>(null);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [pushbackCount, setPushbackCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const sortedCardsRef = useRef<ArgumentCard[]>([]);

  const handleSubmit = useCallback(async () => {
    if (!question.trim() || question.trim().split(/\s+/).length < 3) {
      setError("Tell me more — what specific decision are you wrestling with?");
      return;
    }
    setError(null);
    setPhase("generating");

    try {
      const generated = await generateCards(question.trim());
      setCards(generated);
      sortedCardsRef.current = [];
      setCurrentIndex(0);
      setPushbackCount(0);
      setPhase("swiping");
    } catch {
      setError("Something went wrong. Try again?");
      setPhase("input");
    }
  }, [question]);

  const handleSwipe = useCallback(
    async (position: CardPosition, sortTimeMs: number) => {
      const card = cards[currentIndex];
      if (!card) return;

      const updatedCard = { ...card, position, sortTimeMs };
      const updatedCards = cards.map((c) =>
        c.id === card.id ? updatedCard : c
      );
      setCards(updatedCards);
      sortedCardsRef.current = [
        ...sortedCardsRef.current,
        updatedCard,
      ];

      // Check if we should show pushback (after card 4 and card 8)
      const sortedCount = sortedCardsRef.current.length;
      if (shouldShowPushback(sortedCount - 1) && pushbackCount < 2) {
        setPhase("pushback");
        try {
          const pb = await generatePushback(
            question,
            sortedCardsRef.current,
            pushbackCount > 0
          );
          // Insert pushback card into the deck
          const newCards = [...updatedCards];
          newCards.splice(currentIndex + 1, 0, pb.card);
          setCards(newCards);
          setPushbackData({ message: pb.message, card: pb.card });
          setPushbackCount((c) => c + 1);
        } catch {
          // Pushback failed — continue without it (non-blocking)
          setPhase("swiping");
          setCurrentIndex((i) => i + 1);
        }
        return;
      }

      const nextIndex = currentIndex + 1;

      // Check if we've gone through all cards
      if (nextIndex >= updatedCards.length) {
        setPhase("generating");
        try {
          const bias = analyzeBias(sortedCardsRef.current);
          const res = await generateResults(question, sortedCardsRef.current);
          setResult({
            leanPercentage: bias.leanPercentage,
            leanDirection: bias.leanDirection,
            ...res,
          });
          setPhase("results");
        } catch {
          setError("We hit a snag generating your results. Try again?");
          setPhase("input");
        }
        return;
      }

      setCurrentIndex(nextIndex);
    },
    [cards, currentIndex, question, pushbackCount]
  );

  const handlePushbackContinue = useCallback(() => {
    setPushbackData(null);
    setCurrentIndex((i) => i + 1);
    setPhase("swiping");
  }, []);

  const handleReset = useCallback(() => {
    setPhase("input");
    setQuestion("");
    setCards([]);
    setCurrentIndex(0);
    setPushbackData(null);
    setResult(null);
    setPushbackCount(0);
    setError(null);
    sortedCardsRef.current = [];
  }, []);

  const totalCards = cards.length;
  const sortedCount = Math.min(currentIndex + 1, totalCards);

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 py-5 sm:py-8">
      <AnimatePresence mode="wait">
        {/* INPUT PHASE */}
        {phase === "input" && (
          <motion.div
            key="input"
            className="w-full max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-paper-panel editorial-rule mb-5 border px-6 py-7 sm:px-8 sm:py-9">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <CruxoWordmark
                  size="compact"
                  caption="The app that argues back"
                />
                <span className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  by Bhushan
                </span>
              </div>
              <p className="mt-6 max-w-xl text-sm leading-6 text-[var(--color-text-muted)] sm:text-base">
                Stop asking AI to confirm what you already believe. Cruxo forces
                you to sort each argument, then pushes back when your pattern says
                you have already decided.
              </p>
            </div>

            <div className="bg-paper-panel editorial-rule border p-6 shadow-[0_22px_50px_rgba(20,17,12,0.06)]">
              <label
                htmlFor="decision"
                className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-3"
              >
                What decision are you wrestling with?
              </label>
              <textarea
                id="decision"
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Should I quit my job and go freelance?"
                className="w-full h-28 resize-none border border-[var(--color-border)] bg-[rgba(255,255,255,0.52)] px-4 py-3 text-base leading-7 text-[var(--color-text)] outline-none transition focus:border-[var(--color-border-strong)]"
                maxLength={500}
              />
              {error && (
                <p className="mt-2 text-sm text-[var(--color-challenge)]">{error}</p>
              )}
              <button
                onClick={handleSubmit}
                className="mt-4 w-full border border-[var(--color-text)] bg-[var(--color-text)] py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-bg)] transition hover:opacity-90"
              >
                Think it through
              </button>
            </div>

            {/* Sample decisions — Pretext cloud layout */}
            <div className="mt-5 bg-paper-panel editorial-rule border px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-3">
                Or try one of these
              </p>
              <PretextCloud
                items={SAMPLE_DECISIONS}
                onSelect={(sample) => {
                  setQuestion(sample);
                  setError(null);
                }}
              />
            </div>

            <p className="text-center text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)] mt-6">
              cruxo.ai — stop asking AI to confirm what you already believe
            </p>
          </motion.div>
        )}

        {/* GENERATING PHASE */}
        {phase === "generating" && (
          <motion.div
            key="generating"
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">
              Building both sides of the argument...
            </p>
          </motion.div>
        )}

        {/* SWIPING PHASE */}
        {phase === "swiping" && cards.length > 0 && (
          <motion.div
            key="swiping"
            className="w-full max-w-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Question header */}
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 font-medium">{question}</p>
              <p className="text-xs text-gray-400 mt-1">
                {sortedCount} / {totalCards}
              </p>
            </div>

            {/* Card stack */}
            <div className="relative h-64 mb-6">
              {cards.map((card, i) => (
                <SwipeCard
                  key={card.id}
                  card={card}
                  onSwipe={handleSwipe}
                  isActive={i === currentIndex}
                  showHint={i === 0 && currentIndex === 0}
                />
              ))}
            </div>

            {/* Lean indicator */}
            {sortedCardsRef.current.length > 0 && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm">
                  <span className="text-xs text-red-500">Challenge</span>
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-400 to-green-400 rounded-full transition-all duration-300"
                      style={{
                        width: `${analyzeBias(sortedCardsRef.current).leanPercentage}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-green-500">Support</span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* PUSHBACK PHASE */}
        {phase === "pushback" && pushbackData && (
          <motion.div
            key="pushback"
            className="w-full max-w-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 font-medium">{question}</p>
            </div>
            <div className="relative h-auto">
              <PushbackScreen
                data={pushbackData}
                onContinue={handlePushbackContinue}
              />
            </div>
          </motion.div>
        )}

        {/* RESULTS PHASE */}
        {phase === "results" && result && (
          <motion.div
            key="results"
            className="w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ResultsScreen
              question={question}
              result={result}
              cards={cards}
              onReset={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
