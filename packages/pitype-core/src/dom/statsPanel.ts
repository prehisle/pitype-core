interface StatNode {
  textContent: string | null;
}

interface StatElementMap {
  cpm?: StatNode | null;
  totalCpm?: StatNode | null;
  wpm?: StatNode | null;
  accuracy?: StatNode | null;
  time?: StatNode | null;
  chars?: StatNode | null;
}

export interface DomStatsPanelOptions {
  getLocaleText?: (key: string) => string | undefined;
  realtime?: StatElementMap;
  result?: StatElementMap;
}

const EMPTY_SNAPSHOT = {
  correctCpm: 0,
  totalCpm: 0,
  wpm: 0,
  accuracy: 100,
  durationMs: 0,
  totalChars: 0
};

export function createDomStatsPanel({
  getLocaleText,
  realtime = {},
  result = {}
}: DomStatsPanelOptions = {}) {
  const secondsLabel = () => getLocaleText?.('ui.statsLabels.seconds') || '秒';

  return {
    renderSnapshot: (snapshot?: typeof EMPTY_SNAPSHOT) =>
      renderRealtime(snapshot ?? EMPTY_SNAPSHOT, realtime, secondsLabel),
    renderResults: (snapshot?: typeof EMPTY_SNAPSHOT) =>
      renderResults(snapshot ?? EMPTY_SNAPSHOT, result, secondsLabel),
    reset: () => renderRealtime(EMPTY_SNAPSHOT, realtime, secondsLabel)
  };
}

function renderRealtime(snapshot: typeof EMPTY_SNAPSHOT, elements: StatElementMap, label: () => string) {
  setText(elements.cpm, formatNumber(snapshot.correctCpm));
  setText(elements.totalCpm, formatNumber(snapshot.totalCpm));
  setText(elements.wpm, formatNumber(snapshot.wpm));
  setText(elements.accuracy, `${formatNumber(snapshot.accuracy, 100)}%`);
  setText(elements.time, formatDuration(snapshot.durationMs, label));
  setText(elements.chars, formatNumber(snapshot.totalChars));
}

function renderResults(snapshot: typeof EMPTY_SNAPSHOT, elements: StatElementMap, label: () => string) {
  setText(elements.time, formatDuration(snapshot.durationMs, label));
  setText(elements.cpm, formatNumber(snapshot.correctCpm));
  setText(elements.totalCpm, formatNumber(snapshot.totalCpm));
  setText(elements.wpm, formatNumber(snapshot.wpm));
  setText(elements.accuracy, `${formatNumber(snapshot.accuracy, 100)}%`);
  setText(elements.chars, formatNumber(snapshot.totalChars));
}

function setText(node: StatNode | null | undefined, value: number | string) {
  if (!node) return;
  node.textContent = String(value);
}

function formatNumber(value: number, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function formatDuration(durationMs: number, secondsLabel: () => string) {
  const elapsedSeconds = Math.max(0, durationMs) / 1000;
  return `${elapsedSeconds.toFixed(1).padStart(6, ' ')}${secondsLabel()}`;
}
