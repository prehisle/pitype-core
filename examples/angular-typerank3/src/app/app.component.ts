import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import {
  createSessionRuntime,
  createTextSource,
  createDomInputController,
  createDomStatsPanel,
  createDomCursorAdapter,
  createDomTextRenderer,
  createDomThemeController,
  type StatsSnapshot,
  type TypingEntry
} from 'pitype-core';
import { initLanguageSelector, getActiveLanguage } from './ui/languageController';
import { createResultModal } from './ui/resultModal';
import { initInfoModal } from './ui/infoModal';
import { createLocaleHelpers, type LocaleHelpers } from './ui/localeUtils';
import { texts } from './texts';
import { getText, updatePageText, applyLanguage } from './language';

type EvaluateEvent = TypingEntry & { type: 'input:evaluate'; timestamp: number };
type UndoEvent = TypingEntry & { type: 'input:undo'; timestamp: number };

const INFO_DATA = {
  cpm: {
    title: 'CPM指标说明',
    content:
      '三个数字分别是：\nCPM (Characters Per Minute)\nTCPM（Total Characters Per Minute）\nWPM(Words Per Minute)\n\n CPM是每分钟输入的正确字符数量，只计算正确输入的字符。\n\nTCPM是每分钟输入的所有字符数量，包括正确和错误的字符。\n\nWPM是每分钟输入的单词数，计算方法为：\nWPM = CPM / 5，即每5个字符计为1个单词。\n\n中文输入时，每个汉字通常算作1个字符。'
  }
};

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements AfterViewInit, OnDestroy {
  private localeHelpers: LocaleHelpers | null = null;
  private statsPanel: ReturnType<typeof createDomStatsPanel> | null = null;
  private textRenderer: ReturnType<typeof createDomTextRenderer> | null = null;
  private cursorAdapter: ReturnType<typeof createDomCursorAdapter> | null = null;
  private sessionRuntime: ReturnType<typeof createSessionRuntime> | null = null;
  private inputController: ReturnType<typeof createDomInputController> | null = null;
  private resultModalController: ReturnType<typeof createResultModal> | null = null;
  private themeCleanup: (() => void) | null = null;
  private cursor: HTMLElement | null = null;
  private inputField: HTMLInputElement | null = null;
  private textDisplay: HTMLElement | null = null;
  private textContainer: HTMLElement | null = null;
  private resultModal: HTMLElement | null = null;
  private readonly destroyListeners: Array<() => void> = [];
  private currentText = '';
  private readonly textLibrary = texts;
  private readonly forcedTextIndex: number | null;
  private initialized = false;

  private readonly handleWindowLoad = (_event?: Event): void => {
    if (!this.textRenderer || !this.cursorAdapter) {
      return;
    }

    if (this.textRenderer.getSpans().length > 0 && this.cursor && this.inputField) {
      this.cursorAdapter.updatePosition({ immediate: true });
      this.inputField.focus();
    } else {
      requestAnimationFrame(() => {
        if ((this.textRenderer?.getSpans().length ?? 0) === 0) {
          this.cursorAdapter?.cacheCharSpans();
        }
        if (this.cursor && this.inputField) {
          this.cursorAdapter?.updatePosition({ immediate: true });
          this.inputField.focus();
        }
      });
    }
  };

  constructor() {
    const params =
      typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const forced = params?.get('text');
    this.forcedTextIndex = forced !== null && forced !== undefined ? Number(forced) : null;
  }

  ngAfterViewInit(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.initializeDemo();
  }

  ngOnDestroy(): void {
    this.destroyListeners.splice(0).forEach((cleanup) => cleanup());
    this.themeCleanup?.();
    this.themeCleanup = null;
    this.sessionRuntime?.dispose();
    this.sessionRuntime = null;
    this.cursorAdapter?.resetAnimation();
    this.cursorAdapter = null;
    this.inputController?.detachInput();
    this.inputController = null;
    if (this.cursor) {
      this.cursor.remove();
      this.cursor = null;
    }
    if (this.inputField) {
      this.inputField.remove();
      this.inputField = null;
    }
  }

  private initializeDemo(): void {
    this.textContainer = document.querySelector('.text-container') as HTMLElement | null;
    this.textDisplay = document.getElementById('text-display');
    this.resultModal = document.getElementById('result-modal');
    const restartBtn = document.getElementById('restart-btn');

    if (!this.textContainer || !this.textDisplay || !this.resultModal || !restartBtn) {
      console.error('无法初始化 Angular 版本的 TypeRank3：缺少关键 DOM 元素');
      return;
    }

    this.localeHelpers = createLocaleHelpers({
      getText,
      updatePageText,
      applyLanguage
    });

    this.statsPanel = createDomStatsPanel({
      getLocaleText: this.localeHelpers.getText,
      realtime: {
        cpm: document.getElementById('cpm'),
        totalCpm: document.getElementById('total-cpm'),
        wpm: document.getElementById('wpm'),
        accuracy: document.getElementById('accuracy'),
        time: document.getElementById('time'),
        chars: document.getElementById('char-count')
      },
      result: {
        time: document.getElementById('final-time'),
        cpm: document.getElementById('final-cpm'),
        totalCpm: document.getElementById('final-total-cpm'),
        wpm: document.getElementById('final-wpm'),
        accuracy: document.getElementById('final-accuracy'),
        chars: document.getElementById('final-char-count')
      }
    });

    this.textRenderer = createDomTextRenderer(this.textDisplay);

    this.cursorAdapter = createDomCursorAdapter({
      textDisplay: this.textDisplay,
      textContainer: this.textContainer,
      getCurrentPosition: () => this.getCurrentPosition(),
      getCursor: () => this.cursor,
      getInput: () => this.inputField,
      getSpans: () => this.textRenderer?.getSpans() ?? [],
      setSpans: (spans: HTMLSpanElement[]) => this.textRenderer?.setSpans(spans)
    });

    this.sessionRuntime = createSessionRuntime({
      onEvaluate: (event: EvaluateEvent) => {
        this.textRenderer?.applySpanState(event.index, event.correct);
        this.cursorAdapter?.scheduleRefresh();
      },
      onUndo: (event: UndoEvent) => {
        this.textRenderer?.resetSpanState(event.index);
        this.cursorAdapter?.scheduleRefresh();
      },
      onComplete: (snapshot: StatsSnapshot | null) => {
        if (this.cursor) {
          this.cursor.remove();
          this.cursor = null;
        }
        this.cursorAdapter?.resetAnimation();
        this.showResults(snapshot);
      },
      onReset: () => {
        this.cursorAdapter?.resetAnimation();
      },
      onSnapshot: (snapshot: StatsSnapshot | null) => {
        if (!snapshot) {
          this.statsPanel?.reset();
          return;
        }
        this.statsPanel?.renderSnapshot(snapshot);
      }
    });

    this.inputController = createDomInputController({
      getTypingSession: () => this.sessionRuntime?.getSession() ?? null,
      isResultModalVisible: () => this.resultModal?.style.display === 'flex',
      onCompositionEnd: () => this.cursorAdapter?.updatePosition()
    });

    this.resultModalController = createResultModal({
      modal: this.resultModal,
      restartButton: restartBtn,
      onRestart: () => this.initSession()
    });

    this.registerListener(this.textDisplay, 'click', () => {
      this.inputController?.focusInput();
    });

    const restartIcon = document.getElementById('restart-icon');
    if (restartIcon) {
      this.registerListener(restartIcon, 'click', () => {
        this.resultModalController?.hide();
        this.initSession();
      });
    }

    const infoElements = document.querySelectorAll('[data-info]');
    const infoModal = document.getElementById('info-modal');
    const infoTitle = document.getElementById('info-title');
    const infoContent = document.getElementById('info-content');
    const infoCloseBtn = document.getElementById('info-close-btn');

    initInfoModal({
      triggers: infoElements,
      modal: infoModal,
      titleElement: infoTitle,
      contentElement: infoContent,
      closeButton: infoCloseBtn,
      infoMap: INFO_DATA
    });

    initLanguageSelector({
      applyLanguage: this.localeHelpers.applyLanguage,
      updatePageText: this.localeHelpers.refreshLocaleText
    });

    this.localeHelpers.applyLanguage(getActiveLanguage());
    this.localeHelpers.refreshLocaleText();

    const themeController = createDomThemeController();
    this.themeCleanup = themeController.init();

    this.registerListener(window, 'load', this.handleWindowLoad);

    this.initSession();
  }

  private initSession(): void {
    if (!this.sessionRuntime || !this.textRenderer || !this.cursorAdapter) {
      return;
    }

    let selectedTextIndex: number | null = null;

    if (
      typeof this.forcedTextIndex === 'number' &&
      !Number.isNaN(this.forcedTextIndex) &&
      this.textLibrary[this.forcedTextIndex]
    ) {
      this.currentText = this.textLibrary[this.forcedTextIndex];
      selectedTextIndex = this.forcedTextIndex;
    } else {
      selectedTextIndex = Math.floor(Math.random() * this.textLibrary.length);
      this.currentText = this.textLibrary[selectedTextIndex];
    }

    const currentSource = createTextSource(this.currentText, {
      id: selectedTextIndex !== null ? `text-${selectedTextIndex}` : undefined,
      locale: getActiveLanguage()
    });

    this.sessionRuntime.dispose();
    this.textRenderer.render(currentSource);

    if (this.cursor) {
      this.cursor.remove();
      this.cursor = null;
    }
    this.cursorAdapter.resetAnimation();

    const existingInput = document.getElementById('input-field');
    if (existingInput) {
      this.inputController?.detachInput();
      existingInput.remove();
      this.inputField = null;
    }

    this.sessionRuntime.startSession(currentSource);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.cursorAdapter?.cacheCharSpans();

          if ((this.textRenderer?.getSpans().length ?? 0) === 0) {
            console.error('未找到任何字符元素，无法创建光标');
            return;
          }

          this.createCursor();

          if (!this.inputField) {
            console.error('输入框创建失败');
            return;
          }

          this.cursorAdapter?.updatePosition({ immediate: true });
          this.cursorAdapter?.enableMobileSupport();
          this.cursorAdapter?.enableResponsiveSync();

          this.inputField.value = '';
          this.inputField.focus();
        });
      });
    });

    if (this.resultModal) {
      this.resultModal.style.display = 'none';
    }
  }

  private showResults(snapshot?: StatsSnapshot | null): void {
    if (!this.statsPanel) return;
    const finalSnapshot = snapshot ?? this.sessionRuntime?.getLatestSnapshot();
    if (!finalSnapshot) return;
    this.statsPanel.renderResults(finalSnapshot);
    this.resultModalController?.show();
  }

  private createCursor(): void {
    if (!this.textDisplay) return;
    this.cursor = document.createElement('div');
    this.cursor.className = 'cursor';
    this.textDisplay.appendChild(this.cursor);
    this.cursorAdapter?.resetAnimation();

    if (!document.getElementById('input-field')) {
      const newInputField = document.createElement('input');
      newInputField.type = 'text';
      newInputField.id = 'input-field';
      newInputField.setAttribute('autofocus', '');
      this.textDisplay.appendChild(newInputField);

      this.inputField = newInputField;
      this.inputController?.attachInput(this.inputField);
      this.inputField.style.pointerEvents = 'auto';
    }
  }

  private getCurrentPosition(): number {
    const session = this.sessionRuntime?.getSession();
    if (!session) return 0;
    return session.getState().position;
  }

  private registerListener(
    target: EventTarget | null,
    type: string,
    handler: EventListenerOrEventListenerObject
  ): void {
    if (!target || typeof target.addEventListener !== 'function') {
      return;
    }
    target.addEventListener(type, handler);
    this.destroyListeners.push(() => target.removeEventListener(type, handler));
  }
}
