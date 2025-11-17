import 'pitype-core/styles/pitype-core.css';
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

let currentText = '';
let cursor: HTMLElement | null = null;
let inputField: HTMLInputElement | null = null;

const textContainer = document.querySelector('.pitype-text-container') as HTMLElement;
const textDisplay = document.getElementById('text-display') as HTMLElement;
const resultModal = document.getElementById('result-modal') as HTMLElement;
const restartBtn = document.getElementById('restart-btn') as HTMLElement;

const urlParams = new URLSearchParams(window.location.search);
const forcedTextIndexParam = urlParams.get('text');
const forcedTextIndex = forcedTextIndexParam !== null ? Number(forcedTextIndexParam) : null;
const textLibrary = texts;

const localeHelpers = createLocaleHelpers({
  getText,
  updatePageText,
  applyLanguage
});

const statsPanel = createDomStatsPanel({
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

const textRenderer = createDomTextRenderer(textDisplay);
const themeController = createDomThemeController();
let cursorAdapter = createDomCursorAdapter({
  textDisplay,
  textContainer,
  getCurrentPosition,
  getCursor: () => cursor,
  getInput: () => inputField,
  getSpans: () => textRenderer.getSpans(),
  setSpans: (spans) => textRenderer.setSpans(spans)
});

const sessionRuntime = createSessionRuntime({
  onEvaluate: (event) => {
    textRenderer.applySpanState(event.index, event.correct);
    cursorAdapter?.scheduleRefresh();
  },
  onUndo: (event) => {
    textRenderer.resetSpanState(event.index);
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
      statsPanel.reset();
      return;
    }
    statsPanel.renderSnapshot(snapshot);
  }
});

const inputController = createDomInputController({
  getTypingSession: () => sessionRuntime.getSession(),
  isResultModalVisible: () => resultModal?.style.display === 'flex',
  onCompositionEnd: () => cursorAdapter.updatePosition()
});

const resultModalController = createResultModal({
  modal: resultModal,
  restartButton: restartBtn,
  onRestart: () => init()
});

if (textDisplay) {
  textDisplay.addEventListener('click', () => {
    inputController.focusInput();
  });
}

const restartIcon = document.getElementById('restart-icon');
if (restartIcon) {
  restartIcon.addEventListener('click', () => {
    resultModalController.hide();
    init();
  });
}

function getCurrentPosition(): number {
  const session = sessionRuntime.getSession();
  if (!session) return 0;
  return session.getState().position;
}

// 指标说明图标事件监听
const infoElements = document.querySelectorAll('[data-info]');
const infoModal = document.getElementById('info-modal') as HTMLElement;
const infoTitle = document.getElementById('info-title') as HTMLElement;
const infoContent = document.getElementById('info-content') as HTMLElement;
const infoCloseBtn = document.getElementById('info-close-btn') as HTMLElement;

// 指标说明内容
const infoData = {
  cpm: {
    title: 'CPM指标说明',
    content:
      '三个数字分别是：\nCPM (Characters Per Minute)\nTCPM（Total Characters Per Minute）\nWPM(Words Per Minute)\n\n CPM是每分钟输入的正确字符数量，只计算正确输入的字符。\n\nTCPM是每分钟输入的所有字符数量，包括正确和错误的字符。\n\nWPM是每分钟输入的单词数，计算方法为：\nWPM = CPM / 5，即每5个字符计为1个单词。\n\n中文输入时，每个汉字通常算作1个字符。'
  }
};

initInfoModal({
  triggers: infoElements,
  modal: infoModal,
  titleElement: infoTitle,
  contentElement: infoContent,
  closeButton: infoCloseBtn,
  infoMap: infoData
});

localeHelpers.refreshLocaleText();

function createCursor(): void {
  // 创建光标
  cursor = document.createElement('div');
  cursor.className = 'pitype-cursor cursor';
  textDisplay.appendChild(cursor);
  cursorAdapter.resetAnimation();

  // 创建输入框（如果不存在）
  if (!document.getElementById('input-field')) {
    const newInputField = document.createElement('input');
    newInputField.type = 'text';
    newInputField.id = 'input-field';
    newInputField.setAttribute('autofocus', '');
    newInputField.classList.add('pitype-input');
    textDisplay.appendChild(newInputField);

    inputField = newInputField;
    inputController.attachInput(inputField);
    inputField.style.pointerEvents = 'auto';
  }
}

function init(): void {
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

  sessionRuntime.dispose();
  textRenderer.render(currentSource);

  // 在设置新的内容前，清除现有的光标和输入框
  if (cursor) {
    cursor.remove();
    cursor = null;
  }
  cursorAdapter.resetAnimation();

  const existingInput = document.getElementById('input-field');
  if (existingInput) {
    inputController.detachInput();
    existingInput.remove();
    inputField = null;
  }

  sessionRuntime.startSession(currentSource);

  // 使用多层嵌套的requestAnimationFrame确保DOM完全更新
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // 首先缓存所有字符元素
        cursorAdapter.cacheCharSpans();

        if (textRenderer.getSpans().length === 0) {
          console.error('未找到任何字符元素，无法创建光标');
          return;
        }

        // 然后创建光标
        createCursor();

        // 确保输入框存在
        if (!inputField) {
          console.error('输入框创建失败');
          return;
        }

        // 确保光标定位准确
        cursorAdapter.updatePosition({ immediate: true });

        // 设置移动设备支持
        cursorAdapter.enableMobileSupport();

        // 监听尺寸变化，保持光标位置随容器更新
        cursorAdapter.enableResponsiveSync();

        // 聚焦输入框
        inputField.value = '';
        inputField.focus();
      });
    });
  });

  // 隐藏结果弹窗
  resultModal.style.display = 'none';
}

function showResults(snapshot?: StatsSnapshot | null): void {
  const finalSnapshot = snapshot ?? sessionRuntime.getLatestSnapshot();
  if (!finalSnapshot || !statsPanel) return;
  statsPanel.renderResults(finalSnapshot);
  resultModalController.show();
}

// 添加window.onload事件处理
window.addEventListener('load', function () {
  // 页面完全加载后重新初始化光标位置
  if (textRenderer.getSpans().length > 0 && cursor && inputField) {
    cursorAdapter.updatePosition({ immediate: true });
    // 聚焦输入框
    inputField.focus();
  } else {
    // 如果还没有初始化，等待DOM更新
    requestAnimationFrame(() => {
      if (textRenderer.getSpans().length === 0) {
        cursorAdapter.cacheCharSpans();
      }
      if (cursor && inputField) {
        cursorAdapter.updatePosition({ immediate: true });
        inputField.focus();
      }
    });
  }
});

// 初始化
document.addEventListener('DOMContentLoaded', function () {
  initLanguageSelector({
    applyLanguage: localeHelpers.applyLanguage,
    updatePageText: localeHelpers.refreshLocaleText
  });
  themeController.init();
  init();
});
