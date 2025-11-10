const EMPTY_SNAPSHOT = {
  correctCpm: 0,
  totalCpm: 0,
  wpm: 0,
  accuracy: 100,
  durationMs: 0,
  totalChars: 0
};

export function createStatsPanel({ getLocaleText = () => '' } = {}) {
  const realtime = {
    cpm: document.getElementById('cpm'),
    totalCpm: document.getElementById('total-cpm'),
    wpm: document.getElementById('wpm'),
    accuracy: document.getElementById('accuracy'),
    time: document.getElementById('time'),
    chars: document.getElementById('char-count')
  };

  const result = {
    time: document.getElementById('final-time'),
    cpm: document.getElementById('final-cpm'),
    totalCpm: document.getElementById('final-total-cpm'),
    wpm: document.getElementById('final-wpm'),
    accuracy: document.getElementById('final-accuracy'),
    chars: document.getElementById('final-char-count')
  };

  const secondsLabel = () => getLocaleText('ui.statsLabels.seconds') || '秒';

  return {
    renderSnapshot: (snapshot) => renderRealtime(snapshot ?? EMPTY_SNAPSHOT, realtime, secondsLabel),
    renderResults: (snapshot) => renderResults(snapshot ?? EMPTY_SNAPSHOT, result, secondsLabel),
    reset: () => renderRealtime(EMPTY_SNAPSHOT, realtime, secondsLabel)
  };
}

function renderRealtime(snapshot, elements, secondsLabel) {
  setText(elements.cpm, formatNumber(snapshot.correctCpm));
  setText(elements.totalCpm, formatNumber(snapshot.totalCpm));
  setText(elements.wpm, formatNumber(snapshot.wpm));
  setText(elements.accuracy, `${formatNumber(snapshot.accuracy, 100)}%`);
  setText(elements.time, formatDuration(snapshot.durationMs, secondsLabel));
  setText(elements.chars, formatNumber(snapshot.totalChars));
}

function renderResults(snapshot, elements, secondsLabel) {
  setText(elements.time, formatDuration(snapshot.durationMs, secondsLabel));
  setText(elements.cpm, formatNumber(snapshot.correctCpm));
  setText(elements.totalCpm, formatNumber(snapshot.totalCpm));
  setText(elements.wpm, formatNumber(snapshot.wpm));
  setText(elements.accuracy, `${formatNumber(snapshot.accuracy, 100)}%`);
  setText(elements.chars, formatNumber(snapshot.totalChars));
}

function setText(node, value) {
  if (node) {
    node.textContent = String(value);
  }
}

function formatNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function formatDuration(durationMs, secondsLabel) {
  const elapsedSeconds = Math.max(0, durationMs) / 1000;
  return `${elapsedSeconds.toFixed(1).padStart(6, ' ')}${secondsLabel()}`;
}

