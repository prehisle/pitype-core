import { memo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { StatsSnapshot } from 'pitype-core';

interface StatsPanelProps {
  snapshot: StatsSnapshot | null;
  onInfoClick: () => void;
}

export const StatsPanel = memo(({ snapshot, onInfoClick }: StatsPanelProps) => {
  const { getText } = useLanguage();

  const correctCpm = snapshot?.correctCpm?.toFixed(0) || '0';
  const totalCpm = snapshot?.totalCpm?.toFixed(0) || '0';
  const wpm = snapshot?.wpm?.toFixed(0) || '0';
  const accuracy = snapshot?.accuracy?.toFixed(1) || '100.0';
  const time = snapshot ? (snapshot.durationMs / 1000).toFixed(1) : '0.0';
  const chars = snapshot?.totalChars || 0;

  return (
    <div className="stats">
      <div className="cpm-container">
        <span className="cpm-label">
          <span className="info-text" data-info="cpm" onClick={onInfoClick}>
            {getText('ui.statsLabels.cpm')}:
          </span>
        </span>
        <div className="cpm-values">
          <span id="cpm">{correctCpm}</span>
          <span id="total-cpm" title={getText('ui.statsLabels.totalCpm')}>
            {totalCpm}
          </span>
          <span id="wpm" title={getText('ui.statsLabels.wpm')}>
            {wpm}
          </span>
        </div>
      </div>
      <div className="stat-item">
        {getText('ui.statsLabels.accuracy')}: <span id="accuracy">{accuracy}%</span>
      </div>
      <div className="stat-item">
        {getText('ui.statsLabels.time')}: <span id="time">{time}秒</span>
      </div>
      <div className="stat-item">
        {getText('ui.statsLabels.chars')}: <span id="char-count">{chars}</span>
      </div>
    </div>
  );
});

StatsPanel.displayName = 'StatsPanel';
