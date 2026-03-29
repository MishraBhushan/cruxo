"use client";

interface PretextCloudProps {
  items: readonly string[];
  onSelect: (item: string) => void;
}

/**
 * Sample decision chip cloud.
 * Single-line chips with CSS fit-content — the correct tool for short text.
 * Pretext is used on card bodies where multi-line shrinkwrap matters.
 */
export function PretextCloud({ items, onSelect }: PretextCloudProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <button
          key={item}
          onClick={() => onSelect(item)}
          className="min-h-16 border border-[var(--color-border)] bg-[rgba(255,255,255,0.52)] px-4 py-3 text-left text-sm leading-5 text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:bg-[rgba(255,255,255,0.8)] active:translate-y-px"
        >
          {item}
        </button>
      ))}
    </div>
  );
}
