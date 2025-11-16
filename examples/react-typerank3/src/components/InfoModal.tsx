import { memo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface InfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export const InfoModal = memo(({ visible, onClose }: InfoModalProps) => {
  const { getText } = useLanguage();

  if (!visible) return null;

  return (
    <div id="info-modal" style={{ display: 'flex' }}>
      <div className="modal-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <h2>{getText('ui.info.title')}</h2>
        <div className="info-content">
          <h3>{getText('ui.info.cpm')}</h3>
          <p>{getText('ui.info.cpmDesc')}</p>

          <h3>{getText('ui.info.totalCpm')}</h3>
          <p>{getText('ui.info.totalCpmDesc')}</p>

          <h3>{getText('ui.info.wpm')}</h3>
          <p>{getText('ui.info.wpmDesc')}</p>

          <h3>{getText('ui.info.accuracy')}</h3>
          <p>{getText('ui.info.accuracyDesc')}</p>
        </div>
      </div>
    </div>
  );
});

InfoModal.displayName = 'InfoModal';
