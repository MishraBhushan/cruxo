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

      const sortedCount = sortedCardsRef.current.length;
      const bias = analyzeBias(sortedCardsRef.current);

      if (pushbackCount < 2 && shouldShowPushback(sortedCount, bias)) {
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
          const res = await generateResults(
            question,
            sortedCardsRef.current,
            bias
          );
          setResult({
            ...bias,
            pushbackCount,
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
  const lean = sortedCardsRef.current.length
    ? analyzeBias(sortedCardsRef.current).leanPercentage
    : 50;

  return (
    <main className="min-h-dvh px-4 py-4 sm:px-6 sm:py-6">
      <AnimatePresence mode="wait">
        {phase === "input" && (
          <motion.div
            key="input"
            className="mx-auto w-full max-w-4xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
              <section className="bg-paper-panel editorial-rule border px-5 py-6 sm:px-7 sm:py-8">
                <CruxoWordmark
                  size="compact"
                  caption="The app that argues back"
                />
                <p className="mt-5 max-w-xl text-base leading-7 text-[var(--color-text-muted)] sm:text-lg">
                  Stop asking AI to confirm what you already believe. Cruxo makes
                  you commit on every argument, then pushes back when your sorting
                  pattern says you are only looking for permission.
                </p>
                <div className="mt-6 grid gap-3 border-t border-[var(--color-border)] pt-5 sm:grid-cols-3">
                  <div>
                    <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                      Modality
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-text)]">
                      Swipe to commit.
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                      Personality
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-text)]">
                      Direct, not polite.
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                      Output
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-text)]">
                      Blind spot. Crux. Next step.
                    </p>
                  </div>
                </div>
              </section>

              <section className="bg-paper-panel editorial-rule border p-5 shadow-[0_22px_50px_rgba(20,17,12,0.06)] sm:p-6">
                <label
                  htmlFor="decision"
                  className="block text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]"
                >
                  What decision are you wrestling with?
                </label>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                  Start with one concrete decision. Not your whole life.
                </p>
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
                  className="mt-4 w-full min-h-36 resize-none border border-[var(--color-border)] bg-[rgba(255,255,255,0.58)] px-4 py-4 text-base leading-7 text-[var(--color-text)] outline-none transition focus:border-[var(--color-border-strong)]"
                  maxLength={500}
                />
                <div className="mt-3 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                  <span>3+ words works best</span>
                  <span>{question.trim().length}/500</span>
                </div>
                {error && (
                  <p className="mt-3 text-sm text-[var(--color-challenge)]">{error}</p>
                )}
                <button
                  onClick={handleSubmit}
                  className="mt-5 w-full border border-[var(--color-text)] bg-[var(--color-text)] px-4 py-4 text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-bg)] transition hover:opacity-90"
                >
                  Think it through
                </button>
              </section>
            </div>

            {/* Mobile: horizontal scroll chips */}
            <section className="mt-4 md:hidden">
              <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Or try a sample
              </p>
              <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-2 scrollbar-none">
                {SAMPLE_DECISIONS.map((sample) => (
                  <button
                    key={sample}
                    onClick={() => {
                      setQuestion(sample);
                      setError(null);
                    }}
                    className="shrink-0 whitespace-nowrap border border-[var(--color-border)] bg-[rgba(255,255,255,0.52)] px-3.5 py-2 text-[0.8rem] leading-5 text-[var(--color-text)] transition active:translate-y-px"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </section>

            {/* Desktop: full grid */}
            <section className="hidden bg-paper-panel editorial-rule mt-5 border px-5 py-5 sm:px-6 md:block">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                    Start faster
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                    Tap a sample and stress-test the flow.
                  </p>
                </div>
                <p className="hidden text-[0.7rem] uppercase tracking-[0.16em] text-[var(--color-text-muted)] sm:block">
                  Quick starts
                </p>
              </div>
              <PretextCloud
                items={SAMPLE_DECISIONS}
                onSelect={(sample) => {
                  setQuestion(sample);
                  setError(null);
                }}
              />
            </section>
          </motion.div>
        )}

        {phase === "generating" && (
          <motion.div
            key="generating"
            className="mx-auto grid min-h-[60dvh] w-full max-w-md place-items-center text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-paper-panel editorial-rule border px-8 py-10">
              <div className="mx-auto mb-5 h-8 w-8 rounded-full border-2 border-[var(--color-text)] border-t-transparent animate-spin" />
              <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Building both sides
              </p>
              <p className="mt-3 font-display text-4xl leading-none tracking-[-0.05em] text-[var(--color-text)]">
                Give it a second.
              </p>
            </div>
          </motion.div>
        )}

        {phase === "swiping" && cards.length > 0 && (
          <motion.div
            key="swiping"
            className="mx-auto flex min-h-dvh w-full max-w-xl flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-paper-panel editorial-rule border px-5 py-4">
              <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Sorting arguments
              </p>
              <div className="mt-2 flex items-start justify-between gap-4">
                <p className="max-w-[22ch] text-sm leading-6 text-[var(--color-text)]">
                  {question}
                </p>
                <p className="text-sm font-semibold text-[var(--color-text-muted)]">
                  {sortedCount} / {totalCards}
                </p>
              </div>
            </div>

            <div className="relative my-4 h-[58dvh] min-h-[430px] max-h-[620px]">
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

            <div className="bg-paper-panel editorial-rule border px-5 py-4">
              <div className="mb-2 flex justify-between text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                <span>Challenge</span>
                <span>Support</span>
              </div>
              <div className="h-2 overflow-hidden bg-[rgba(23,20,16,0.08)]">
                <div
                  className="h-full bg-gradient-to-r from-[var(--color-challenge)] to-[var(--color-support)] transition-all duration-300"
                  style={{ width: `${lean}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                {sortedCardsRef.current.length === 0
                  ? "Your lean appears after the first sort."
                  : `Current lean: ${lean}% toward support.`}
              </p>
            </div>
          </motion.div>
        )}

        {phase === "pushback" && pushbackData && (
          <motion.div
            key="pushback"
            className="mx-auto w-full max-w-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-paper-panel editorial-rule mb-4 border px-5 py-4">
              <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Pushback
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text)]">{question}</p>
            </div>
            <PushbackScreen
              data={pushbackData}
              onContinue={handlePushbackContinue}
            />
          </motion.div>
        )}

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
              onReset={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
