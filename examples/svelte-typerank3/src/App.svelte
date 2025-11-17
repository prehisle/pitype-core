<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import {
    createSessionRuntime,
    createTextSource,
    createDomInputController,
    createDomStatsPanel,
    createDomCursorAdapter,
    createDomTextRenderer,
    createDomThemeController,
    type StatsSnapshot
  } from 'pitype-core';
  import { initLanguageSelector, getActiveLanguage } from './ui/languageController';
  import { createResultModal } from './ui/resultModal';
  import { initInfoModal } from './ui/infoModal';
  import { createLocaleHelpers } from './ui/localeUtils';
  import { texts } from './texts';
  import { getText, updatePageText, applyLanguage } from './language';

  let textContainerRef: HTMLElement | null = null;
  let textDisplayRef: HTMLElement | null = null;
  let resultModalRef: HTMLElement | null = null;
  let restartButtonRef: HTMLButtonElement | null = null;
  let restartIconRef: HTMLButtonElement | null = null;
  let infoModalRef: HTMLElement | null = null;
  let infoTitleRef: HTMLElement | null = null;
  let infoContentRef: HTMLElement | null = null;
  let infoCloseBtnRef: HTMLButtonElement | null = null;

  let cursor: HTMLElement | null = null;
  let inputField: HTMLInputElement | null = null;

  const urlParams = new URLSearchParams(window.location.search);
  const forcedTextIndexParam = urlParams.get('text');
  const forcedTextIndex = forcedTextIndexParam !== null ? Number(forcedTextIndexParam) : null;
  const textLibrary = texts;

  let sessionRuntime: ReturnType<typeof createSessionRuntime> | null = null;
  let textRenderer: ReturnType<typeof createDomTextRenderer> | null = null;
  let cursorAdapter: ReturnType<typeof createDomCursorAdapter> | null = null;
  let inputController: ReturnType<typeof createDomInputController> | null = null;
  let resultModalController: ReturnType<typeof createResultModal> | null = null;
  let statsPanel: ReturnType<typeof createDomStatsPanel> | null = null;
  let localeHelpers: ReturnType<typeof createLocaleHelpers>;

  const infoData = {
    cpm: {
      title: 'CPM指标说明',
      content:
        '三个数字分别是：\nCPM (Characters Per Minute)\nTCPM（Total Characters Per Minute）\nWPM(Words Per Minute)\n\n CPM是每分钟输入的正确字符数量，只计算正确输入的字符。\n\nTCPM是每分钟输入的所有字符数量，包括正确和错误的字符。\n\nWPM是每分钟输入的单词数，计算方法为：\nWPM = CPM / 5，即每5个字符计为1个单词。\n\n中文输入时，每个汉字通常算作1个字符。'
    }
  } as const;

  const cleanupFns: Array<() => void> = [];

  function registerCleanup(fn: () => void): void {
    cleanupFns.push(fn);
  }

  function getCurrentPosition(): number {
    const session = sessionRuntime?.getSession();
    if (!session) return 0;
    return session.getState().position;
  }

  function createCursor(): void {
    if (!textDisplayRef) return;

    cursor = document.createElement('div');
    cursor.className = 'pitype-cursor cursor';
    textDisplayRef.appendChild(cursor);
    cursorAdapter?.resetAnimation();

    if (!document.getElementById('input-field')) {
      const newInputField = document.createElement('input');
      newInputField.type = 'text';
      newInputField.id = 'input-field';
      newInputField.setAttribute('autofocus', '');
      newInputField.classList.add('pitype-input');
      textDisplayRef.appendChild(newInputField);

      inputField = newInputField;
      inputController?.attachInput(inputField);
      inputField.style.pointerEvents = 'auto';
    }
  }

  function showResults(snapshot?: StatsSnapshot | null): void {
    const finalSnapshot = snapshot ?? sessionRuntime?.getLatestSnapshot();
    if (!finalSnapshot || !statsPanel) return;
    statsPanel.renderResults(finalSnapshot);
    resultModalController?.show();
  }

  function initSession(): void {
    const renderer = textRenderer;
    const runtime = sessionRuntime;
    const adapter = cursorAdapter;

    if (!renderer || !runtime || !adapter) return;

    let currentText = '';
    let selectedTextIndex: number | null = null;

    if (
      typeof forcedTextIndex === 'number' &&
      !Number.isNaN(forcedTextIndex) &&
      textLibrary[forcedTextIndex]
    ) {
      currentText = textLibrary[forcedTextIndex];
      selectedTextIndex = forcedTextIndex;
    } else {
      selectedTextIndex = Math.floor(Math.random() * textLibrary.length);
      currentText = textLibrary[selectedTextIndex];
    }

    const currentSource = createTextSource(currentText, {
      id: selectedTextIndex !== null ? `text-${selectedTextIndex}` : undefined,
      locale: getActiveLanguage()
    });

    runtime.dispose();
    renderer.render(currentSource);

    if (cursor) {
      cursor.remove();
      cursor = null;
    }
    adapter.resetAnimation();

    const existingInput = document.getElementById('input-field');
    if (existingInput) {
      inputController?.detachInput();
      existingInput.remove();
      inputField = null;
    }

    runtime.startSession(currentSource);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          adapter.cacheCharSpans();

          if ((renderer.getSpans().length ?? 0) === 0) {
            console.error('未找到任何字符元素，无法创建光标');
            return;
          }

          createCursor();

          if (!inputField) {
            console.error('输入框创建失败');
            return;
          }

          adapter.updatePosition({ immediate: true });
          adapter.enableMobileSupport();
          adapter.enableResponsiveSync();

          inputField.value = '';
          inputField.focus();
        });
      });
    });

    if (resultModalRef) {
      resultModalRef.style.display = 'none';
    }
  }

  onMount(() => {
    if (!textDisplayRef || !textContainerRef || !resultModalRef) {
      console.error('初始化失败，必要的 DOM 元素缺失');
      return;
    }

    localeHelpers = createLocaleHelpers({
      getText,
      updatePageText,
      applyLanguage
    });

    statsPanel = createDomStatsPanel({
      getLocaleText: localeHelpers.getText,
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

    textRenderer = createDomTextRenderer(textDisplayRef);
    const themeController = createDomThemeController();

    cursorAdapter = createDomCursorAdapter({
      textDisplay: textDisplayRef,
      textContainer: textContainerRef,
      getCurrentPosition,
      getCursor: () => cursor,
      getInput: () => inputField,
      getSpans: () => textRenderer?.getSpans() ?? [],
      setSpans: (spans) => {
        if (textRenderer) {
          textRenderer.setSpans(spans);
        }
      }
    });

    sessionRuntime = createSessionRuntime({
      onEvaluate: (event) => {
        textRenderer?.applySpanState(event.index, event.correct);
        cursorAdapter?.scheduleRefresh();
      },
      onUndo: (event) => {
        textRenderer?.resetSpanState(event.index);
        cursorAdapter?.scheduleRefresh();
      },
      onComplete: (snapshot) => {
        if (cursor) {
          cursor.remove();
          cursor = null;
        }
        cursorAdapter?.resetAnimation();
        showResults(snapshot);
      },
      onReset: () => {
        cursorAdapter?.resetAnimation();
      },
      onSnapshot: (snapshot: StatsSnapshot | null) => {
        if (!snapshot) {
          statsPanel?.reset();
          return;
        }
        statsPanel?.renderSnapshot(snapshot);
      }
    });

    inputController = createDomInputController({
      getTypingSession: () => sessionRuntime?.getSession() ?? null,
      isResultModalVisible: () => resultModalRef?.style.display === 'flex',
      onCompositionEnd: () => cursorAdapter?.updatePosition()
    });

    resultModalController = createResultModal({
      modal: resultModalRef,
      restartButton: restartButtonRef,
      onRestart: () => initSession()
    });

    textDisplayRef.addEventListener('click', handleTextDisplayClick);
    registerCleanup(() => textDisplayRef?.removeEventListener('click', handleTextDisplayClick));

    if (restartIconRef) {
      restartIconRef.addEventListener('click', handleRestartIconClick);
      registerCleanup(() => restartIconRef?.removeEventListener('click', handleRestartIconClick));
    }

    const infoElements = document.querySelectorAll('[data-info]');
    initInfoModal({
      triggers: infoElements,
      modal: infoModalRef,
      titleElement: infoTitleRef,
      contentElement: infoContentRef,
      closeButton: infoCloseBtnRef,
      infoMap: infoData
    });

    localeHelpers.refreshLocaleText();

    initLanguageSelector({
      applyLanguage: localeHelpers.applyLanguage,
      updatePageText: localeHelpers.refreshLocaleText
    });

    const disposeTheme = themeController.init();
    registerCleanup(() => {
      disposeTheme?.();
    });

    const handleWindowLoad = (): void => {
      if ((textRenderer?.getSpans().length ?? 0) > 0 && cursor && inputField) {
        cursorAdapter?.updatePosition({ immediate: true });
        inputField.focus();
      } else {
        requestAnimationFrame(() => {
          if ((textRenderer?.getSpans().length ?? 0) === 0) {
            cursorAdapter?.cacheCharSpans();
          }
          if (cursor && inputField) {
            cursorAdapter?.updatePosition({ immediate: true });
            inputField.focus();
          }
        });
      }
    };

    window.addEventListener('load', handleWindowLoad);
    registerCleanup(() => window.removeEventListener('load', handleWindowLoad));

    initSession();
  });

  function handleTextDisplayClick(): void {
    inputController?.focusInput();
  }

  function handleRestartIconClick(): void {
    resultModalController?.hide();
    initSession();
  }

  onDestroy(() => {
    cleanupFns.forEach((fn) => fn());
    sessionRuntime?.dispose();
    cursorAdapter?.resetAnimation();
    const existingInput = document.getElementById('input-field');
    existingInput?.remove();
    cursor?.remove();
  });
</script>

<div class="pitype-container container">
  <div class="pitype-header header">
    <h1>TypeFree <span class="pitype-version version">v0.1.21-svelte</span></h1>
    <div class="pitype-controls controls">
      <div class="pitype-selector-container selector-container">
        <div class="pitype-language-selector language-selector">
          <div
            class="pitype-language-option language-option pitype-lang-zh-CN lang-zh-CN active"
            data-lang="zh-CN"
            title="简体中文"
          >CN</div>
          <div
            class="pitype-language-option language-option pitype-lang-zh-TW lang-zh-TW"
            data-lang="zh-TW"
            title="繁體中文"
          >TW</div>
          <div
            class="pitype-language-option language-option pitype-lang-en-US lang-en-US"
            data-lang="en-US"
            title="English"
          >EN</div>
        </div>
        <div class="pitype-selector-divider selector-divider"></div>
        <div class="pitype-theme-selector theme-selector">
          <div
            class="pitype-theme-option pitype-theme-dracula theme-option theme-dracula active"
            data-theme="dracula"
            title="Dracula 主题"
          ></div>
          <div
            class="pitype-theme-option pitype-theme-serika theme-option theme-serika"
            data-theme="serika"
            title="Serika 主题"
          ></div>
          <div
            class="pitype-theme-option pitype-theme-botanical theme-option theme-botanical"
            data-theme="botanical"
            title="Botanical 主题"
          ></div>
          <div
            class="pitype-theme-option pitype-theme-aether theme-option theme-aether"
            data-theme="aether"
            title="Aether 主题"
          ></div>
          <div
            class="pitype-theme-option pitype-theme-nord theme-option theme-nord"
            data-theme="nord"
            title="Nord 主题"
          ></div>
        </div>
        <button id="restart-icon" title="重新开始" bind:this={restartIconRef}>
          <i class="fas fa-redo"></i>
        </button>
      </div>
    </div>
  </div>

  <div class="pitype-stats stats">
    <div class="pitype-cpm-container cpm-container">
      <span class="pitype-cpm-label cpm-label">
        <span class="pitype-info-text info-text" data-info="cpm" title="点击查看CPM/WPM指标说明">CPM:</span>
      </span>
      <div class="pitype-cpm-values cpm-values">
        <span id="cpm" class="pitype-cpm-value cpm-value">0</span>
        <span id="total-cpm" class="pitype-tcpm-value tcpm-value">0</span>
        <span id="wpm" class="pitype-wpm-value wpm-value">0</span>
      </div>
    </div>
    <div class="pitype-stat-item stat-item">
      正确率: <span id="accuracy" class="pitype-stat-value stat-value">100%</span>
    </div>
    <div class="pitype-stat-item stat-item">
      时间: <span id="time" class="pitype-stat-value stat-value">0000.0秒</span>
    </div>
    <div class="pitype-stat-item stat-item">
      字符数: <span id="char-count" class="pitype-stat-value stat-value">0</span>
    </div>
  </div>

  <div class="pitype-text-container" bind:this={textContainerRef}>
    <div id="text-display" class="pitype-text-display" bind:this={textDisplayRef}></div>
  </div>

  <div class="pitype-footer footer">
    <span class="copyright">&copy; 2025 TypeFree - 自由无感提升输入效率</span>
  </div>
</div>

<div
  id="result-modal"
  class="pitype-modal modal"
  bind:this={resultModalRef}
  style="display: none;"
>
  <div class="pitype-modal-content modal-content">
    <h2><i class="fas fa-trophy"></i> 练习完成！</h2>
    <div class="pitype-result-stats result-stats">
      <p><span class="pitype-stat-label stat-label"><i class="fas fa-clock"></i> 总用时:</span> <span id="final-time"></span></p>
      <p><span class="pitype-stat-label stat-label"><i class="fas fa-keyboard"></i> CPM:</span> <span id="final-cpm"></span></p>
      <p><span class="pitype-stat-label stat-label"><i class="fas fa-tachometer-alt"></i> 总CPM:</span> <span id="final-total-cpm"></span></p>
      <p><span class="pitype-stat-label stat-label"><i class="fas fa-file-word"></i> WPM:</span> <span id="final-wpm"></span></p>
      <p><span class="pitype-stat-label stat-label"><i class="fas fa-check-circle"></i> 正确率:</span> <span id="final-accuracy"></span></p>
      <p><span class="pitype-stat-label stat-label"><i class="fas fa-font"></i> 总字符数:</span> <span id="final-char-count"></span></p>
    </div>
    <button id="restart-btn" bind:this={restartButtonRef}>
      <i class="fas fa-redo"></i> 重新开始
    </button>
  </div>
</div>

<div
  id="info-modal"
  class="pitype-modal modal"
  bind:this={infoModalRef}
  style="display: none;"
>
  <div class="pitype-modal-content modal-content">
    <h3 id="info-title" bind:this={infoTitleRef}>指标说明</h3>
    <p id="info-content" bind:this={infoContentRef}></p>
    <button id="info-close-btn" bind:this={infoCloseBtnRef}>关闭</button>
  </div>
</div>
