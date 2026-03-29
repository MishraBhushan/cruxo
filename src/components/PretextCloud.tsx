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
    <div className="inline-grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min-content, 1fr))" }}>
      {items.map((item) => (
        <button
          key={item}
          onClick={() => onSelect(item)}
          className="whitespace-nowrap border border-[var(--color-border)] bg-[rgba(255,255,255,0.52)] px-3.5 py-2 text-xs text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:bg-[rgba(255,255,255,0.8)] text-left"
        >
          {item}
        </button>
      ))}
    </div>
  );
}
