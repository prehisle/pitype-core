import { describe, expect, it, vi } from 'vitest';
import { createDomStatsPanel } from '../../src/dom/statsPanel.js';

const createNode = () => ({ textContent: '' });

describe('createDomStatsPanel', () => {
  it('renders realtime snapshot with locale seconds', () => {
    const nodes = {
      cpm: createNode(),
      totalCpm: createNode(),
      wpm: createNode(),
      accuracy: createNode(),
      time: createNode(),
      chars: createNode()
    };

    const panel = createDomStatsPanel({
      getLocaleText: (key) => (key === 'ui.statsLabels.seconds' ? '秒钟' : undefined),
      realtime: nodes
    });

    panel.renderSnapshot({
      correctCpm: 120,
      totalCpm: 150,
      wpm: 24,
      accuracy: 98,
      durationMs: 5000,
      totalChars: 42
    });

    expect(nodes.cpm.textContent).toBe('120');
    expect(nodes.totalCpm.textContent).toBe('150');
    expect(nodes.wpm.textContent).toBe('24');
    expect(nodes.accuracy.textContent).toBe('98%');
    expect(nodes.time.textContent).toContain('秒钟');
    expect(nodes.chars.textContent).toBe('42');
  });

  it('falls back to reset snapshot', () => {
    const cpm = createNode();
    const panel = createDomStatsPanel({ realtime: { cpm } });
    panel.reset();
    expect(cpm.textContent).toBe('0');
  });

  it('renders results panel independently', () => {
    const nodes = {
      time: createNode(),
      cpm: createNode(),
      totalCpm: createNode(),
      wpm: createNode(),
      accuracy: createNode(),
      chars: createNode()
    };
    const panel = createDomStatsPanel({ result: nodes });
    panel.renderResults({
      correctCpm: 200,
      totalCpm: 220,
      wpm: 40,
      accuracy: 90,
      durationMs: 10000,
      totalChars: 70
    });
    expect(nodes.cpm.textContent).toBe('200');
    expect(nodes.accuracy.textContent).toBe('90%');
    expect(nodes.time.textContent).toContain('秒');
  });
});
