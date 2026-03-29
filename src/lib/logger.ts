// Server-side response logging for debugging and analytics
// Logs to stdout in dev, structured JSON for production ingestion

interface LogEntry {
  event: string;
  question?: string;
  phase?: string;
  cardCount?: number;
  leanDirection?: string;
  leanPercentage?: number;
  helped?: boolean;
  durationMs?: number;
  error?: string;
  cached?: boolean;
  timestamp: string;
}

export function log(entry: Omit<LogEntry, "timestamp">): void {
  const full: LogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === "development") {
    const { event, timestamp, ...rest } = full;
    const details = Object.entries(rest)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(" ");
    console.log(`[cruxo] ${timestamp} ${event} ${details}`);
  } else {
    console.log(JSON.stringify(full));
  }
}
