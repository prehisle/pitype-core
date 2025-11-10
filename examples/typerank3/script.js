import { TypingSession, createStatsTracker, createTextSource } from './vendor/index.js';
import { initThemeSelector } from './ui/themeController.js';
import { initLanguageSelector, getActiveLanguage } from './ui/languageController.js';
import { createStatsPanel } from './ui/statsPanel.js';
import { createCursorAdapter } from './ui/cursorAdapter.js';
import { createInputController } from './ui/inputController.js';
import { createResultModal } from './ui/resultModal.js';
import { initInfoModal } from './ui/infoModal.js';
import { createTextRenderer } from './ui/textRenderer.js';

let currentText = '';
let cursor = null;
let typingSession = null;
let statsTracker = null;
let sessionUnsubscribe = null;
let statsTimer = null;
let currentSource = null;
let inputField = null; // 将在创建时获取引用
const textContainer = document.querySelector('.text-container');
const textDisplay = document.getElementById('text-display');
// 移除初始引用，因为元素将被动态创建
// const inputField = document.getElementById('input-field');
const resultModal = document.getElementById('result-modal');
const restartBtn = document.getElementById('restart-btn');
const urlParams = new URLSearchParams(window.location.search);
const forcedTextIndexParam = urlParams.get('text');
const forcedTextIndex = forcedTextIndexParam !== null ? Number(forcedTextIndexParam) : null;
const textLibrary = window.texts || [];
const getLocaleText =
  typeof window.getText === 'function' ? (key) => window.getText(key) : () => '';
const applyLanguageFn =
  typeof window.applyLanguage === 'function' ? (lang) => window.applyLanguage(lang) : () => {};
const updatePageTextFn =
  typeof window.updatePageText === 'function' ? () => window.updatePageText() : () => {};
const statsPanel = createStatsPanel({ getLocaleText });
const textRenderer = createTextRenderer(textDisplay);
const cursorAdapter = createCursorAdapter({
  textDisplay,
  textContainer,
  getCurrentPosition,
  getCursor: () => cursor,
  getInput: () => inputField,
  getSpans: () => textRenderer.getSpans(),
  setSpans: (spans) => textRenderer.setSpans(spans)
});
const inputController = createInputController({
  getTypingSession: () => typingSession,
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

function getCurrentPosition() {
  if (!typingSession) return 0;
  return typingSession.getState().position;
}

function disposeSession() {
  if (sessionUnsubscribe) {
    sessionUnsubscribe();
    sessionUnsubscribe = null;
  }
  typingSession = null;
  statsTracker = null;
}

function startStatsTimer() {
  if (statsTimer) return;
  statsTimer = setInterval(updateStats, 1000);
}

function stopStatsTimer() {
  if (statsTimer) {
    clearInterval(statsTimer);
    statsTimer = null;
  }
}

// 指标说明图标事件监听
const infoElements = document.querySelectorAll('[data-info]');
const infoModal = document.getElementById('info-modal');
const infoTitle = document.getElementById('info-title');
const infoContent = document.getElementById('info-content');
const infoCloseBtn = document.getElementById('info-close-btn');

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

function createCursor() {
  // 创建光标
  cursor = document.createElement('div');
  cursor.className = 'cursor';
  textDisplay.appendChild(cursor);
  cursorAdapter.resetAnimation();

  // 创建输入框（如果不存在）
  if (!document.getElementById('input-field')) {
    const newInputField = document.createElement('input');
    newInputField.type = 'text';
    newInputField.id = 'input-field';
    newInputField.setAttribute('autofocus', '');
    textDisplay.appendChild(newInputField);

    inputField = newInputField;
    inputController.attachInput(inputField);
    inputField.style.pointerEvents = 'auto';
  }
}

function init() {
  let selectedTextIndex = null;
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
  currentSource = createTextSource(currentText, {
    id: selectedTextIndex !== null ? `text-${selectedTextIndex}` : undefined,
    locale: getActiveLanguage()
  });
  stopStatsTimer();
  disposeSession();

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

  typingSession = new TypingSession({ source: currentSource });
  statsTracker = createStatsTracker(typingSession);
  sessionUnsubscribe = typingSession.subscribe(handleSessionEvent);

  // 使用多层嵌套的requestAnimationFrame确保DOM完全更新
  // 第一次requestAnimationFrame确保DOM开始更新
  requestAnimationFrame(() => {
    // 第二次requestAnimationFrame确保DOM已完全渲染
    requestAnimationFrame(() => {
      // 第三次requestAnimationFrame确保所有样式计算完成
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

  // 重置统计信息
  statsPanel.reset();

  // 隐藏结果弹窗
  resultModal.style.display = 'none';
}

function handleSessionEvent(event) {
  switch (event.type) {
    case 'session:start':
      startStatsTimer();
      updateStats();
      break;
    case 'input:evaluate':
      textRenderer.applySpanState(event.index, event.correct);
      updateStats();
      cursorAdapter.scheduleRefresh();
      break;
    case 'input:undo':
      textRenderer.resetSpanState(event.index);
      updateStats();
      cursorAdapter.scheduleRefresh();
      break;
    case 'session:complete':
      stopStatsTimer();
      updateStats();
      if (cursor) {
        cursor.remove();
        cursor = null;
      }
      cursorAdapter.resetAnimation();
      showResults();
      break;
    case 'session:reset':
      stopStatsTimer();
      updateStats();
      break;
    default:
      break;
  }
}

// 统一使用此updateStats函数
function updateStats() {
  if (!statsPanel) return;
  if (!statsTracker) {
    statsPanel.reset();
    return;
  }

  statsPanel.renderSnapshot(statsTracker.getSnapshot());
}

function showResults() {
  if (!statsTracker || !statsPanel) return;

  const snapshot = statsTracker.getSnapshot();
  statsPanel.renderResults(snapshot);

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
    applyLanguage: applyLanguageFn,
    updatePageText: updatePageTextFn
  }); // 初始化语言选择器
  initThemeSelector(); // 初始化主题选择器
  init(); // 初始化应用
});
