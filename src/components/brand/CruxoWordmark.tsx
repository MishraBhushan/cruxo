"use client";

import { motion } from "framer-motion";
import { buildBrandSystem, splitWordmark } from "@/lib/brand";

interface CruxoWordmarkProps {
  size?: "hero" | "compact";
  expressive?: boolean;
  withMotion?: boolean;
  caption?: string;
}

const sizeClasses = {
  hero: {
    wrap: "gap-3",
    text: "text-[clamp(3.4rem,11vw,8.4rem)]",
    caption: "text-[0.72rem] tracking-[0.24em]",
  },
  compact: {
    wrap: "gap-2",
    text: "text-[clamp(2rem,5vw,3.4rem)]",
    caption: "text-[0.68rem] tracking-[0.22em]",
  },
};

export function CruxoWordmark({
  size = "hero",
  expressive = false,
  withMotion = true,
  caption,
}: CruxoWordmarkProps) {
  const brand = buildBrandSystem();
  const wordmark = expressive ? brand.expressiveWordmark : brand.masterWordmark;
  const parts = splitWordmark(wordmark);
  const classes = sizeClasses[size];

  return (
    <div className="inline-grid gap-3">
      <div
        className={`inline-flex items-end ${classes.wrap} ${classes.text} font-display leading-none tracking-[-0.06em] text-[var(--color-text)]`}
      >
        {parts.map((part, index) => {
          const isDetached = expressive && index === parts.length - 1;

          if (!withMotion) {
            return (
              <span
                key={`${part}-${index}`}
                className={isDetached ? "ml-2" : undefined}
              >
                {part}
              </span>
            );
          }

          return (
            <motion.span
              key={`${part}-${index}`}
              className={isDetached ? "ml-2" : undefined}
              initial={{ opacity: 0, y: 24 }}
              animate={{
                opacity: 1,
                y: 0,
                x: isDetached ? [0, 6, 0] : 0,
                rotate: isDetached ? [0, 1.2, 0] : 0,
              }}
              transition={{
                duration: 0.9,
                delay: 0.1 * index,
                ease: [0.16, 1, 0.3, 1],
                repeat: isDetached ? Number.POSITIVE_INFINITY : 0,
                repeatDelay: 2.2,
              }}
            >
              {part}
            </motion.span>
          );
        })}
      </div>

      {caption ? (
        <p
          className={`${classes.caption} m-0 uppercase text-[var(--color-text-muted)]`}
        >
          {caption}
        </p>
      ) : null}
    </div>
  );
}
