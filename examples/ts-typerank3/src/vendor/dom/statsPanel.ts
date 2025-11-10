import { StatsSnapshot } from '../statsTracker';

const EMPTY_SNAPSHOT: StatsSnapshot = {
  correctCpm: 0,
  totalCpm: 0,
  wpm: 0,
  accuracy: 100,
  durationMs: 0,
  totalChars: 0,
  correctChars: 0,
  completed: false
};

export interface StatsPanelElements {
  cpm?: HTMLElement | null;
  totalCpm?: HTMLElement | null;
  wpm?: HTMLElement | null;
  accuracy?: HTMLElement | null;
  time?: HTMLElement | null;
  chars?: HTMLElement | null;
}

export interface DomStatsPanelOptions {
  getLocaleText?: (key: string) => string;
  realtime?: StatsPanelElements;
  result?: StatsPanelElements;
}

export interface DomStatsPanel {
  renderSnapshot(snapshot: StatsSnapshot | null): void;
  renderResults(snapshot: StatsSnapshot | null): void;
  reset(): void;
}

export function createDomStatsPanel({
  getLocaleText,
  realtime = {},
  result = {}
}: DomStatsPanelOptions = {}): DomStatsPanel {
  const secondsLabel = (): string =>
    getLocaleText?.('ui.statsLabels.seconds') || '秒';

  return {
    renderSnapshot: (snapshot) =>
      renderRealtime(snapshot ?? EMPTY_SNAPSHOT, realtime, secondsLabel),
    renderResults: (snapshot) =>
      renderResults(snapshot ?? EMPTY_SNAPSHOT, result, secondsLabel),
    reset: () => renderRealtime(EMPTY_SNAPSHOT, realtime, secondsLabel)
  };
}

function renderRealtime(
  snapshot: StatsSnapshot,
  elements: StatsPanelElements,
  label: () => string
): void {
  setText(elements.cpm, formatNumber(snapshot.correctCpm));
  setText(elements.totalCpm, formatNumber(snapshot.totalCpm));
  setText(elements.wpm, formatNumber(snapshot.wpm));
  setText(elements.accuracy, `${formatNumber(snapshot.accuracy, 100)}%`);
  setText(elements.time, formatDuration(snapshot.durationMs, label));
  setText(elements.chars, formatNumber(snapshot.totalChars));
}

function renderResults(
  snapshot: StatsSnapshot,
  elements: StatsPanelElements,
  label: () => string
): void {
  setText(elements.time, formatDuration(snapshot.durationMs, label));
  setText(elements.cpm, formatNumber(snapshot.correctCpm));
  setText(elements.totalCpm, formatNumber(snapshot.totalCpm));
  setText(elements.wpm, formatNumber(snapshot.wpm));
  setText(elements.accuracy, `${formatNumber(snapshot.accuracy, 100)}%`);
  setText(elements.chars, formatNumber(snapshot.totalChars));
}

function setText(node: HTMLElement | null | undefined, value: string | number): void {
  if (!node) return;
  node.textContent = String(value);
}

function formatNumber(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

function formatDuration(durationMs: number, secondsLabel: () => string): string {
  const elapsedSeconds = Math.max(0, durationMs) / 1000;
  return `${elapsedSeconds.toFixed(1).padStart(6, ' ')}${secondsLabel()}`;
}
