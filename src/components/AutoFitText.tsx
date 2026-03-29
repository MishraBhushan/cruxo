"use client";

import { useEffect, useRef, useState } from "react";
import { fitFontSizeToHeight } from "@/lib/text-fit";

interface AutoFitTextProps {
  text: string;
  className?: string;
  minFontSize?: number;
  maxFontSize?: number;
  lineHeightRatio?: number;
  fontFamily?: string;
  fontWeight?: number;
}

const DEFAULT_FONT_FAMILY = '"Familjen Grotesk"';

export function AutoFitText({
  text,
  className,
  minFontSize = 20,
  maxFontSize = 40,
  lineHeightRatio = 1.08,
  fontFamily = DEFAULT_FONT_FAMILY,
  fontWeight = 500,
}: AutoFitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    let cancelled = false;
    let observer: ResizeObserver | null = null;

    async function setup() {
      const pretext = await import("@chenglou/pretext");
      if (cancelled) return;

      const preparedBySize = new Map<number, ReturnType<typeof pretext.prepareWithSegments>>();
      for (let size = minFontSize; size <= maxFontSize; size += 1) {
        preparedBySize.set(
          size,
          pretext.prepareWithSegments(text, `${fontWeight} ${size}px ${fontFamily}`),
        );
      }

      const recompute = () => {
        if (!element) return;
        const width = Math.max(0, Math.floor(element.clientWidth));
        const height = Math.max(0, Math.floor(element.clientHeight));
        if (width === 0 || height === 0) return;

        const nextSize = fitFontSizeToHeight({
          min: minFontSize,
          max: maxFontSize,
          maxHeight: height,
          measureHeight: (size) => {
            const prepared = preparedBySize.get(size);
            if (!prepared) return Number.POSITIVE_INFINITY;
            const lineHeight = Math.round(size * lineHeightRatio);
            return pretext.layout(prepared, width, lineHeight).height;
          },
        });

        setFontSize(nextSize);
      };

      recompute();
      observer = new ResizeObserver(() => {
        recompute();
      });
      if (element) observer.observe(element);
    }

    setup().catch((error) => {
      console.error("Failed to load pretext for auto-fit text", error);
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [fontFamily, fontWeight, lineHeightRatio, maxFontSize, minFontSize, text]);

  return (
    <div ref={containerRef} className="h-full w-full">
      <p
        className={className}
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: lineHeightRatio,
        }}
      >
        {text}
      </p>
    </div>
  );
}
