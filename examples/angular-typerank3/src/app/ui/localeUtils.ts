export interface LocaleHelpersOptions {
  getText?: (path: string) => string;
  updatePageText?: () => void;
  applyLanguage?: (lang: string) => void;
}

export interface LocaleHelpers {
  getText: (path: string) => string;
  refreshLocaleText: () => void;
  applyLanguage: (lang: string) => void;
}

export function createLocaleHelpers({
  getText = () => '',
  updatePageText = () => {},
  applyLanguage = () => {}
}: LocaleHelpersOptions = {}): LocaleHelpers {
  const safeGetText = typeof getText === 'function' ? getText : () => '';
  const safeUpdatePageText = typeof updatePageText === 'function' ? updatePageText : () => {};
  const safeApplyLanguage = typeof applyLanguage === 'function' ? applyLanguage : () => {};

  const restartButton = document.getElementById('restart-btn');

  const updateStatsPlaceholders = (): void => {
    const accuracyLabel = document.querySelector('.stat-item:nth-child(2)');
    if (accuracyLabel) {
      accuracyLabel.innerHTML = `${safeGetText('ui.statsLabels.accuracy')} <span id="accuracy" class="stat-value">100%</span>`;
    }

    const timeLabel = document.querySelector('.stat-item:nth-child(3)');
    if (timeLabel) {
      timeLabel.innerHTML = `${safeGetText('ui.statsLabels.time')} <span id="time" class="stat-value">0000.0${safeGetText('ui.statsLabels.seconds')}</span>`;
    }

    const charCountLabel = document.querySelector('.stat-item:nth-child(4)');
    if (charCountLabel) {
      charCountLabel.innerHTML = `${safeGetText('ui.statsLabels.charCount')} <span id="char-count" class="stat-value">0</span>`;
    }
  };

  const updateResultModalText = (): void => {
    const resultTitle = document.querySelector('#result-modal h2');
    if (resultTitle) {
      resultTitle.innerHTML = `<i class="fas fa-trophy"></i> ${safeGetText('ui.results.completed')}`;
    }

    const resultLabels = document.querySelectorAll('#result-modal .stat-label');
    if (resultLabels.length >= 6) {
      resultLabels[0].innerHTML = `<i class="fas fa-clock"></i> ${safeGetText('ui.results.totalTime')}`;
      resultLabels[3].innerHTML = `<i class="fas fa-check-circle"></i> ${safeGetText('ui.results.accuracy')}`;
      resultLabels[5].innerHTML = `<i class="fas fa-font"></i> ${safeGetText('ui.results.totalChars')}`;
    }
  };

  const updateInfoModalText = (): void => {
    const infoTitle = document.getElementById('info-title');
    if (infoTitle) {
      infoTitle.textContent = safeGetText('ui.info.title');
    }

    const infoContent = document.getElementById('info-content');
    if (infoContent) {
      infoContent.textContent = safeGetText('ui.info.content');
    }

    const infoCloseBtn = document.getElementById('info-close-btn');
    if (infoCloseBtn) {
      infoCloseBtn.textContent = safeGetText('ui.info.close');
    }
  };

  const updateRestartButtonText = (): void => {
    if (restartButton) {
      restartButton.innerHTML = `<i class="fas fa-redo"></i> ${safeGetText('ui.restart')}`;
    }
  };

  const updateCpmLabel = (): void => {
    const cpmLabel = document.querySelector('.info-text');
    if (cpmLabel) {
      cpmLabel.textContent = safeGetText('ui.statsLabels.cpm');
    }
  };

  const updateFooter = (): void => {
    const footer = document.querySelector('.footer .copyright');
    if (footer) {
      footer.textContent = safeGetText('ui.footer.copyright');
    }
  };

  const updateThemeTooltips = (): void => {
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach((option) => {
      const theme = option.getAttribute('data-theme');
      if (theme) {
        option.setAttribute('title', safeGetText(`ui.theme.${theme}`));
      }
    });
  };

  const refreshLocaleText = (): void => {
    safeUpdatePageText();
    updateStatsPlaceholders();
    updateResultModalText();
    updateInfoModalText();
    updateRestartButtonText();
    updateCpmLabel();
    updateFooter();
    updateThemeTooltips();
  };

  return {
    getText: safeGetText,
    refreshLocaleText,
    applyLanguage: safeApplyLanguage
  };
}
