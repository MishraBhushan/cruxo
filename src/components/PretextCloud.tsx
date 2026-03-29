"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { prepare, layout } from "@chenglou/pretext";

interface PretextCloudProps {
  items: readonly string[];
  onSelect: (item: string) => void;
  font?: string;
  lineHeight?: number;
  gap?: number;
  paddingX?: number;
  paddingY?: number;
}

interface ItemMetrics {
  text: string;
  width: number;
  height: number;
}

/**
 * Pretext-powered chip cloud — measures each chip's text to compute
 * exact tight-fit widths. No dead space, no layout shift.
 */
export function PretextCloud({
  items,
  onSelect,
  font = '13px "Familjen Grotesk", sans-serif',
  lineHeight = 18,
  gap = 8,
  paddingX = 14,
  paddingY = 8,
}: PretextCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<ItemMetrics[]>([]);

  const measure = useCallback(() => {
    const measured: ItemMetrics[] = items.map((text) => {
      const prepared = prepare(text, font);
      const result = layout(prepared, 600, lineHeight);
      // Single-line chip: width = text width + padding
      // For multi-word chips, find the tightest single-line width
      let lo = 20;
      let hi = 600;
      while (hi - lo > 1) {
        const mid = (lo + hi) / 2;
        const { lineCount } = layout(prepared, mid, lineHeight);
        if (lineCount > 1) {
          lo = mid;
        } else {
          hi = mid;
        }
      }
      return {
        text,
        width: Math.ceil(hi) + paddingX * 2,
        height: Math.ceil(result.height) + paddingY * 2,
      };
    });
    setMetrics(measured);
  }, [items, font, lineHeight, paddingX, paddingY]);

  useEffect(() => {
    measure();
  }, [measure]);

  if (metrics.length === 0) {
    // Fallback before measurement
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item}
            onClick={() => onSelect(item)}
            className="border border-[var(--color-border)] bg-[rgba(255,255,255,0.52)] px-3 py-1.5 text-xs text-[var(--color-text)] transition hover:border-[var(--color-border-strong)]"
          >
            {item}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-wrap"
      style={{ gap: `${gap}px` }}
    >
      {metrics.map((item) => (
        <button
          key={item.text}
          onClick={() => onSelect(item.text)}
          className="border border-[var(--color-border)] bg-[rgba(255,255,255,0.52)] text-xs text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:bg-[rgba(255,255,255,0.8)] whitespace-nowrap"
          style={{
            width: `${item.width}px`,
            height: `${item.height}px`,
            padding: `${paddingY}px ${paddingX}px`,
          }}
        >
          {item.text}
        </button>
      ))}
    </div>
  );
}
