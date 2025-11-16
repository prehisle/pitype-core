import { memo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { StatsSnapshot } from 'pitype-core';

interface ResultModalProps {
  visible: boolean;
  snapshot: StatsSnapshot | null;
  onClose: () => void;
  onRestart: () => void;
}

export const ResultModal = memo(({ visible, snapshot, onClose, onRestart }: ResultModalProps) => {
  const { getText } = useLanguage();

  if (!visible || !snapshot) return null;

  const correctCpm = snapshot.correctCpm.toFixed(0);
  const totalCpm = snapshot.totalCpm.toFixed(0);
  const wpm = snapshot.wpm.toFixed(0);
  const accuracy = snapshot.accuracy.toFixed(1);
  const time = (snapshot.durationMs / 1000).toFixed(1);
  const correctChars = snapshot.correctChars;
  const incorrectChars = snapshot.totalChars - snapshot.correctChars;
  const totalChars = snapshot.totalChars;

  return (
    <div id="result-modal" style={{ display: 'flex' }}>
      <div className="modal-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <h2>{getText('ui.result.title')}</h2>
        <div className="result-grid">
          <div className="result-item">
            <div className="result-label">{getText('ui.result.cpm')}</div>
            <div id="final-cpm" className="result-value">
              {correctCpm}
            </div>
          </div>
          <div className="result-item">
            <div className="result-label">{getText('ui.result.totalCpm')}</div>
            <div id="final-total-cpm" className="result-value">
              {totalCpm}
            </div>
          </div>
          <div className="result-item">
            <div className="result-label">{getText('ui.result.wpm')}</div>
            <div id="final-wpm" className="result-value">
              {wpm}
            </div>
          </div>
          <div className="result-item">
            <div className="result-label">{getText('ui.result.accuracy')}</div>
            <div id="final-accuracy" className="result-value">
              {accuracy}%
            </div>
          </div>
          <div className="result-item">
            <div className="result-label">{getText('ui.result.time')}</div>
            <div id="final-time" className="result-value">
              {time}秒
            </div>
          </div>
          <div className="result-item">
            <div className="result-label">{getText('ui.result.correctChars')}</div>
            <div id="final-correct-chars" className="result-value">
              {correctChars}
            </div>
          </div>
          <div className="result-item">
            <div className="result-label">{getText('ui.result.incorrectChars')}</div>
            <div id="final-incorrect-chars" className="result-value">
              {incorrectChars}
            </div>
          </div>
          <div className="result-item">
            <div className="result-label">{getText('ui.result.totalChars')}</div>
            <div id="final-total-chars" className="result-value">
              {totalChars}
            </div>
          </div>
        </div>
        <button className="restart-button-modal" onClick={onRestart}>
          {getText('ui.restart')}
        </button>
      </div>
    </div>
  );
});

ResultModal.displayName = 'ResultModal';
