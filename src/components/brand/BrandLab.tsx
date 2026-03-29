"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CruxoWordmark } from "@/components/brand/CruxoWordmark";
import { buildBrandSystem } from "@/lib/brand";

type Study = {
  key: string;
  title: string;
  family: string;
  note: string;
  verdict: string;
  metrics: Array<[string, string]>;
  svg: string;
};

type IconStudy = {
  key: string;
  title: string;
  note: string;
};

type PretextModule = typeof import("@chenglou/pretext");

const iconStudies: IconStudy[] = [
  {
    key: "I1",
    title: "Crosshair O",
    note: "The O becomes a target and the X remains implicit in the tensions around it.",
  },
  {
    key: "I2",
    title: "Split Ledger",
    note: "Feels like evidence and verdict living in the same mark without becoming corporate.",
  },
  {
    key: "I3",
    title: "Orbit X",
    note: "The strongest abstract icon if you need a favicon or app tile before a full symbol exists.",
  },
];

function font(size: number, weight = 600, style = "normal") {
  return `${style} ${weight} ${size}px var(--font-display), serif`;
}

function svgText({
  text,
  x,
  y,
  size,
  weight = 600,
  style = "normal",
  anchor = "start",
}: {
  text: string;
  x: number;
  y: number;
  size: number;
  weight?: number;
  style?: "normal" | "italic";
  anchor?: "start" | "middle";
}) {
  return `<text x="${x}" y="${y}" fill="#171410" font-family="Cormorant Garamond, serif" font-size="${size}" font-weight="${weight}" font-style="${style}" text-anchor="${anchor}">${text}</text>`;
}

function svgRule(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width = 1,
  opacity = 1,
) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#171410" stroke-width="${width}" opacity="${opacity}" />`;
}

function svgRect(
  x: number,
  y: number,
  width: number,
  height: number,
  strokeWidth = 1,
  opacity = 1,
) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="none" stroke="#171410" stroke-width="${strokeWidth}" opacity="${opacity}" />`;
}

function svgCircle(
  cx: number,
  cy: number,
  r: number,
  strokeWidth = 1,
  opacity = 1,
) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#171410" stroke-width="${strokeWidth}" opacity="${opacity}" />`;
}

function buildStudies(pretext: PretextModule, width: number): Study[] {
  const { prepareWithSegments, layout, layoutWithLines, walkLineRanges } = pretext;
  const pressure = width / 168;

  function findWidthForLineCount(
    text: string,
    fontValue: string,
    targetLines: number,
    minWidth: number,
    maxWidth: number,
    lineHeight: number,
  ) {
    const prepared = prepareWithSegments(text, fontValue);
    let matchedWidth = maxWidth;
    let matchedLines = layout(prepared, maxWidth, lineHeight).lineCount;

    for (let candidate = minWidth; candidate <= maxWidth; candidate += 1) {
      const result = layout(prepared, candidate, lineHeight);
      if (result.lineCount === targetLines) {
        matchedWidth = candidate;
        matchedLines = result.lineCount;
        break;
      }

      if (result.lineCount < matchedLines) {
        matchedWidth = candidate;
        matchedLines = result.lineCount;
      }
    }

    return { prepared, width: matchedWidth, lineCount: matchedLines };
  }

  function shrinkwrapWidth(prepared: ReturnType<PretextModule["prepareWithSegments"]>, currentWidth: number) {
    const targetLineCount = layout(prepared, currentWidth, 10).lineCount;
    let tightest = currentWidth;
    let widestLine = 0;

    for (let candidate = 42; candidate <= currentWidth; candidate += 1) {
      if (layout(prepared, candidate, 10).lineCount === targetLineCount) {
        tightest = candidate;
        break;
      }
    }

    walkLineRanges(prepared, tightest, (line) => {
      widestLine = Math.max(widestLine, line.width);
    });

    return { tightest, widestLine };
  }

  const sizeA = Math.round(92 * pressure);
  const lineA = Math.round(68 * pressure);
  const split = findWidthForLineCount("CRUXO", font(sizeA, 600), 2, 100, width + 88, lineA);
  const splitTight = shrinkwrapWidth(split.prepared, split.width);
  const splitBlock = layoutWithLines(split.prepared, splitTight.tightest, lineA);
  const splitSvgWidth = splitTight.widestLine + 52;
  const splitSvgHeight = splitBlock.height + 54;

  const sizeB = Math.round(88 * pressure);
  const lineB = Math.round(66 * pressure);
  const indent = findWidthForLineCount("CRUXO", font(sizeB, 600, "italic"), 2, 104, width + 92, lineB);
  const indentTight = shrinkwrapWidth(indent.prepared, indent.width);
  const indentBlock = layoutWithLines(indent.prepared, indentTight.tightest, lineB);
  const indentShift = Math.min(24, indentTight.widestLine * 0.12);
  const indentSvgWidth = indentTight.widestLine + indentShift + 46;
  const indentSvgHeight = indentBlock.height + 56;

  const crossSize = Math.round(86 * pressure);
  const crossGap = 6;
  const crossCru = layoutWithLines(
    prepareWithSegments("CRUX", font(crossSize, 600)),
    3000,
    10,
  );
  const crossO = layoutWithLines(
    prepareWithSegments("O", font(Math.round(92 * pressure), 700)),
    3000,
    10,
  );
  const crossWidth = crossCru.lines[0]!.width + crossGap + crossO.lines[0]!.width + 56;
  const crossCenter = 28 + crossCru.lines[0]!.width + crossGap + crossO.lines[0]!.width / 2;

  const ledgerSize = Math.round(82 * pressure);
  const ledgerLine = Math.round(62 * pressure);
  const ledger = findWidthForLineCount("CRUX O", font(ledgerSize, 600), 2, 108, width + 80, ledgerLine);
  const ledgerTight = shrinkwrapWidth(ledger.prepared, ledger.width);
  const ledgerBlock = layoutWithLines(ledger.prepared, ledgerTight.tightest, ledgerLine);
  const ledgerSvgWidth = ledgerTight.widestLine + 76;
  const ledgerSvgHeight = ledgerBlock.height + 64;

  const ringCru = layoutWithLines(
    prepareWithSegments("CRUX", font(Math.round(80 * pressure), 600)),
    3000,
    10,
  );
  const ringO = layoutWithLines(
    prepareWithSegments("O", font(Math.round(92 * pressure), 700)),
    3000,
    10,
  );
  const ringCenter = 28 + ringCru.lines[0]!.width + crossGap + ringO.lines[0]!.width / 2;
  const ringSvgWidth = ringCru.lines[0]!.width + ringO.lines[0]!.width + 64;

  return [
    {
      key: "S1",
      title: "Split Verdict",
      family: "Pretext stack",
      note: "This is the cleanest proof that the library matters. The wrap is measured, then tightened until the block feels authored.",
      verdict: "Best primary lockup",
      metrics: [
        ["lines", `${splitBlock.lineCount}`],
        ["wrap", `${splitTight.tightest}px`],
        ["tone", "Direct"],
      ],
      svg: `<svg viewBox="0 0 ${splitSvgWidth} ${splitSvgHeight}" role="img" aria-label="CRUXO split over two lines">${svgRule(0, 14, splitSvgWidth, 14, 1, 0.36)}${splitBlock.lines.map((line, index) => svgText({ text: line.text, x: 26, y: 18 + sizeA + index * lineA, size: sizeA })).join("")}${svgRule(0, splitSvgHeight - 8, splitSvgWidth, splitSvgHeight - 8, 1, 0.32)}</svg>`,
    },
    {
      key: "S2",
      title: "Indented Appeal",
      family: "Pretext stack",
      note: "A slight offset on the lower line makes the mark feel editorial instead of product-marketing safe.",
      verdict: "Best campaign lockup",
      metrics: [
        ["lines", `${indentBlock.lineCount}`],
        ["shift", `${Math.round(indentShift)}px`],
        ["tone", "Sharper"],
      ],
      svg: `<svg viewBox="0 0 ${indentSvgWidth} ${indentSvgHeight}" role="img" aria-label="CRUXO indented over two lines">${svgRule(0, 18, indentSvgWidth * 0.56, 18, 1, 0.42)}${indentBlock.lines.map((line, index) => svgText({ text: line.text, x: 22 + (index === 1 ? indentShift : 0), y: 24 + sizeB + index * lineB, size: sizeB, style: "italic" })).join("")}${svgRule(indentSvgWidth * 0.22, indentSvgHeight - 10, indentSvgWidth, indentSvgHeight - 10, 1, 0.3)}</svg>`,
    },
    {
      key: "T1",
      title: "Crosshair O",
      family: "Measured tension",
      note: "Keep the word intact, but isolate the O as the judgment point. It feels severe without drifting into tech-brand theater.",
      verdict: "Best motion-ready logo",
      metrics: [
        ["parts", "2"],
        ["pivot", `${Math.round(crossCenter)}px`],
        ["risk", "Low"],
      ],
      svg: `<svg viewBox="0 0 ${crossWidth} 176" role="img" aria-label="CRUX O with crosshair">${svgRule(crossCenter, 16, crossCenter, 158, 1.1, 0.42)}${svgRule(crossCenter - 42, 78, crossCenter + 42, 78, 1.1, 0.42)}${svgText({ text: "CRUX", x: 28, y: 104, size: crossSize })}${svgText({ text: "O", x: 28 + crossCru.lines[0]!.width + crossGap, y: 104, size: Math.round(92 * pressure), weight: 700 })}</svg>`,
    },
    {
      key: "T2",
      title: "Ring Decision",
      family: "Measured tension",
      note: "This is the strongest route if the icon eventually emerges from the O rather than from an arbitrary abstract symbol.",
      verdict: "Best icon bridge",
      metrics: [
        ["parts", "2"],
        ["geometry", "Ring"],
        ["risk", "Medium"],
      ],
      svg: `<svg viewBox="0 0 ${ringSvgWidth} 180" role="img" aria-label="CRUX O with ring">${svgCircle(ringCenter, 80, 31, 1.1, 0.34)}${svgCircle(ringCenter, 80, 22, 0.8, 0.22)}${svgText({ text: "CRUX", x: 28, y: 106, size: Math.round(80 * pressure) })}${svgText({ text: "O", x: 28 + ringCru.lines[0]!.width + crossGap, y: 106, size: Math.round(92 * pressure), weight: 700 })}</svg>`,
    },
    {
      key: "P1",
      title: "Ledger Frame",
      family: "System frame",
      note: "Looks like a reasoning artifact instead of a startup mascot. That is exactly the right instinct for this product.",
      verdict: "Best system mark",
      metrics: [
        ["lines", `${ledgerBlock.lineCount}`],
        ["frame", "Ledger"],
        ["tone", "Archival"],
      ],
      svg: `<svg viewBox="0 0 ${ledgerSvgWidth} ${ledgerSvgHeight}" role="img" aria-label="CRUX O in ledger frame">${svgRect(10, 10, ledgerSvgWidth - 20, ledgerSvgHeight - 20, 1, 0.34)}${svgRule(ledgerSvgWidth * 0.68, 10, ledgerSvgWidth * 0.68, ledgerSvgHeight - 10, 0.8, 0.18)}${ledgerBlock.lines.map((line, index) => svgText({ text: line.text, x: 24, y: 24 + ledgerSize + index * ledgerLine, size: ledgerSize })).join("")}</svg>`,
    },
    {
      key: "P2",
      title: "Opposing Rails",
      family: "System frame",
      note: "The frame itself suggests support versus challenge. Good as a page header or section stamp, not as the sole brand mark.",
      verdict: "Best secondary asset",
      metrics: [
        ["lines", "1"],
        ["frame", "Rails"],
        ["tone", "Analytic"],
      ],
      svg: `<svg viewBox="0 0 430 160" role="img" aria-label="CRUXO with opposing rails">${svgRule(18, 20, 18, 140, 2, 0.5)}${svgRule(30, 34, 30, 126, 0.9, 0.22)}${svgRule(412, 20, 412, 140, 2, 0.5)}${svgRule(400, 34, 400, 126, 0.9, 0.22)}${svgText({ text: "CRUXO", x: 215, y: 100, size: Math.round(82 * pressure), anchor: "middle" })}</svg>`,
    },
  ];
}

function IconGlyph({ type }: { type: IconStudy["key"] }) {
  if (type === "I1") {
    return (
      <motion.svg
        viewBox="0 0 120 120"
        className="h-28 w-28"
        animate={{ rotate: [0, 3, 0] }}
        transition={{ duration: 4.6, repeat: Number.POSITIVE_INFINITY }}
      >
        <motion.circle
          cx="60"
          cy="60"
          r="26"
          fill="none"
          stroke="#171410"
          strokeWidth="1.4"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3.8, repeat: Number.POSITIVE_INFINITY }}
        />
        <line x1="60" y1="14" x2="60" y2="106" stroke="#171410" strokeWidth="1" opacity="0.6" />
        <line x1="14" y1="60" x2="106" y2="60" stroke="#171410" strokeWidth="1" opacity="0.6" />
      </motion.svg>
    );
  }

  if (type === "I2") {
    return (
      <motion.svg
        viewBox="0 0 120 120"
        className="h-28 w-28"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 4.2, repeat: Number.POSITIVE_INFINITY }}
      >
        <rect x="16" y="16" width="88" height="88" fill="none" stroke="#171410" strokeWidth="1.2" opacity="0.42" />
        <line x1="72" y1="16" x2="72" y2="104" stroke="#171410" strokeWidth="1" opacity="0.22" />
        <circle cx="48" cy="60" r="16" fill="none" stroke="#171410" strokeWidth="1.3" />
        <line x1="78" y1="46" x2="96" y2="74" stroke="#171410" strokeWidth="1.5" />
        <line x1="96" y1="46" x2="78" y2="74" stroke="#171410" strokeWidth="1.5" />
      </motion.svg>
    );
  }

  return (
    <motion.svg
      viewBox="0 0 120 120"
      className="h-28 w-28"
      animate={{ rotate: [0, -6, 0] }}
      transition={{ duration: 5.2, repeat: Number.POSITIVE_INFINITY }}
    >
      <circle cx="60" cy="60" r="28" fill="none" stroke="#171410" strokeWidth="1.3" />
      <motion.circle
        cx="60"
        cy="60"
        r="16"
        fill="none"
        stroke="#171410"
        strokeWidth="0.9"
        animate={{ scale: [1, 0.92, 1] }}
        transition={{ duration: 3.6, repeat: Number.POSITIVE_INFINITY }}
      />
      <line x1="42" y1="42" x2="78" y2="78" stroke="#171410" strokeWidth="1.5" />
      <line x1="78" y1="42" x2="42" y2="78" stroke="#171410" strokeWidth="1.5" />
    </motion.svg>
  );
}

export function BrandLab() {
  const brand = buildBrandSystem();
  const [width, setWidth] = useState(168);
  const [studies, setStudies] = useState<Study[]>([]);
  const [prepareTime, setPrepareTime] = useState<string>("--");

  useEffect(() => {
    let cancelled = false;

    async function compute() {
      await document.fonts.ready;
      const pretext = await import("@chenglou/pretext");
      if (cancelled) return;

      const report = pretext.profilePrepare(brand.masterWordmark, font(88, 600));
      setPrepareTime(report.totalMs.toFixed(2));
      setStudies(buildStudies(pretext, width));
    }

    compute().catch((error) => {
      console.error(error);
    });

    return () => {
      cancelled = true;
    };
  }, [brand.masterWordmark, width]);

  return (
    <main className="min-h-dvh px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto grid max-w-7xl gap-5">
        <motion.section
          className="bg-paper-panel editorial-rule relative overflow-hidden border px-6 py-8 sm:px-10 sm:py-12"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="absolute inset-y-0 right-[18%] hidden w-px bg-[var(--color-border)] lg:block" />
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
            <div className="grid gap-8">
              <p className="m-0 text-[0.72rem] uppercase tracking-[0.28em] text-[var(--color-text-muted)]">
                Brand Direction / Direct / Editorial / Severe
              </p>
              <CruxoWordmark
                size="hero"
                expressive={false}
                caption="Master wordmark: CRUXO"
              />
              <p className="m-0 max-w-2xl text-base leading-7 text-[var(--color-text-muted)] sm:text-lg">
                The brand should not look friendly, soft, or conversational. It should
                feel like a private argument becoming visible. The cleanest system is
                <strong className="ml-1 text-[var(--color-text)]">CRUXO</strong> as the
                master mark, with
                <strong className="mx-1 text-[var(--color-text)]">CRUX O</strong>
                reserved for expressive layouts and motion.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/"
                  className="border border-[var(--color-border-strong)] px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-text)] transition hover:bg-[rgba(23,20,16,0.05)]"
                >
                  Open App
                </Link>
                <div className="border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)]">
                  Pretext prepare: {prepareTime}ms
                </div>
              </div>
            </div>

            <div className="grid content-start gap-4">
              <div className="border border-[var(--color-border)] bg-[rgba(255,255,255,0.45)] p-5">
                <p className="m-0 text-[0.7rem] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                  Naming system
                </p>
                <div className="mt-4 grid gap-3">
                  <div className="flex items-baseline justify-between gap-4 border-b border-[var(--color-border)] pb-3">
                    <span className="text-sm text-[var(--color-text-muted)]">Primary</span>
                    <span className="font-display text-3xl tracking-[-0.05em]">{brand.masterWordmark}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 border-b border-[var(--color-border)] pb-3">
                    <span className="text-sm text-[var(--color-text-muted)]">UI</span>
                    <span className="text-lg font-semibold">{brand.uiName}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 border-b border-[var(--color-border)] pb-3">
                    <span className="text-sm text-[var(--color-text-muted)]">Expressive</span>
                    <span className="font-display text-2xl tracking-[-0.05em]">{brand.expressiveWordmark}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm text-[var(--color-text-muted)]">Reject</span>
                    <span className="font-display text-2xl tracking-[-0.05em] text-[var(--color-text-muted)] line-through">
                      {brand.rejectedWordmarks[0]}
                    </span>
                  </div>
                </div>
              </div>

              <motion.div
                className="border border-[var(--color-border)] bg-[rgba(255,255,255,0.35)] p-5"
                initial={{ opacity: 0.7 }}
                animate={{ opacity: 1 }}
              >
                <CruxoWordmark
                  size="compact"
                  expressive
                  caption="Expressive motion variant"
                />
              </motion.div>
            </div>
          </div>
        </motion.section>

        <section className="bg-paper-panel editorial-rule border px-6 py-6 sm:px-8">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <p className="m-0 text-[0.72rem] uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
                Pretext studies
              </p>
              <h2 className="font-display mt-3 text-4xl leading-none tracking-[-0.05em] sm:text-6xl">
                Real measured wordmarks.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-muted)]">
                These are not eyeballed SVGs. The stacked compositions use Pretext to
                find widths, line counts, and tighter lockups before the mark gets
                drawn.
              </p>
            </div>

            <label className="grid gap-2">
              <span className="text-[0.72rem] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Pressure
              </span>
              <input
                type="range"
                min={128}
                max={248}
                value={width}
                onChange={(event) => setWidth(Number(event.target.value))}
                className="w-full accent-[var(--color-text)]"
              />
              <span className="text-sm text-[var(--color-text-muted)]">{width}px base width</span>
            </label>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {studies.map((study, index) => (
              <motion.article
                key={study.key}
                className="border border-[var(--color-border)] bg-[rgba(255,255,255,0.44)] p-5"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="m-0 text-[0.68rem] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                      {study.family}
                    </p>
                    <h3 className="font-display mt-2 text-3xl leading-none tracking-[-0.05em]">
                      {study.title}
                    </h3>
                  </div>
                  <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                    {study.key}
                  </span>
                </div>

                <div
                  className="mt-5 border-y border-[var(--color-border)] py-5"
                  dangerouslySetInnerHTML={{ __html: study.svg }}
                />

                <p className="mt-5 text-sm leading-6 text-[var(--color-text-muted)]">
                  {study.note}
                </p>

                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[var(--color-border)] pt-4">
                  {study.metrics.map(([label, value]) => (
                    <div key={`${study.key}-${label}`} className="grid gap-1">
                      <span className="text-[0.64rem] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                        {label}
                      </span>
                      <span className="text-sm">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 border-t border-[var(--color-border)] pt-4 text-sm font-medium text-[var(--color-text)]">
                  {study.verdict}
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="bg-paper-panel editorial-rule border px-6 py-6 sm:px-8">
            <p className="m-0 text-[0.72rem] uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
              Icon studies
            </p>
            <h2 className="font-display mt-3 text-4xl leading-none tracking-[-0.05em] sm:text-6xl">
              Abstract enough for a favicon. Not abstract enough to lie.
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {iconStudies.map((study, index) => (
                <motion.article
                  key={study.key}
                  className="grid gap-4 border border-[var(--color-border)] bg-[rgba(255,255,255,0.42)] p-5"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.05 }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-3xl tracking-[-0.05em]">{study.title}</h3>
                    <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                      {study.key}
                    </span>
                  </div>
                  <div className="grid place-items-center border-y border-[var(--color-border)] py-4">
                    <IconGlyph type={study.key} />
                  </div>
                  <p className="m-0 text-sm leading-6 text-[var(--color-text-muted)]">
                    {study.note}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>

          <aside className="bg-paper-panel editorial-rule grid content-start gap-5 border px-6 py-6">
            <div>
              <p className="m-0 text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                Type
              </p>
              <p className="font-display mt-2 text-4xl tracking-[-0.05em]">Cormorant Garamond</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                Editorial, severe, not startup-safe.
              </p>
            </div>

            <div>
              <p className="m-0 text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                Body
              </p>
              <p className="mt-2 text-2xl font-semibold">Familjen Grotesk</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                Neutral enough for the product, still not generic.
              </p>
            </div>

            <div>
              <p className="m-0 text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                Palette
              </p>
              <div className="mt-3 grid gap-3">
                {[
                  ["Ink", "#171410"],
                  ["Paper", "#f3efe6"],
                  ["Muted", "#5d5348"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-4 w-4 border border-[var(--color-border)]"
                        style={{ background: value }}
                      />
                      <span className="text-sm">{label}</span>
                    </div>
                    <span className="text-xs uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
