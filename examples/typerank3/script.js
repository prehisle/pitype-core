import { TypingSession, createStatsTracker, createTextSource } from './vendor/index.js';
import { initThemeSelector } from './ui/themeController.js';
import { initLanguageSelector, getActiveLanguage } from './ui/languageController.js';
import { createStatsPanel } from './ui/statsPanel.js';
import { createCursorAdapter } from './ui/cursorAdapter.js';

let currentText = '';
let cursor = null;
let typingSession = null;
let statsTracker = null;
let sessionUnsubscribe = null;
let statsTimer = null;
let currentSource = null;
let isComposing = false;
let inputField = null; // 将在创建时获取引用
let potentialCompositionStart = false;
let allCharSpans = [];
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
const cursorAdapter = createCursorAdapter({
  textDisplay,
  textContainer,
  getCurrentPosition,
  getCursor: () => cursor,
  getInput: () => inputField,
  getSpans: () => allCharSpans,
  setSpans: (spans) => {
    allCharSpans = spans;
  }
});

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

// 重新开始图标事件监听
const restartIcon = document.getElementById('restart-icon');
if (restartIcon) {
  restartIcon.addEventListener('click', function () {
    // 移除回车键监听器
    document.removeEventListener('keydown', handleResultsKeydown);
    // 重新开始练习
    init();
  });
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

// 为每个具有data-info属性的元素添加点击事件
infoElements.forEach((element) => {
  element.addEventListener('click', function (event) {
    // 阻止事件冒泡，避免点击事件被父元素捕获
    event.stopPropagation();

    const infoType = this.getAttribute('data-info');
    if (infoData[infoType]) {
      infoTitle.textContent = infoData[infoType].title;
      infoContent.textContent = infoData[infoType].content;

      // 先显示弹窗
      infoModal.style.display = 'flex';

      // 使用动画效果
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          infoModal.classList.add('show');
        });
      });
    }
  });
});

// 关闭信息弹窗按钮
if (infoCloseBtn) {
  infoCloseBtn.addEventListener('click', function () {
    // 移除show类触发动画
    infoModal.classList.remove('show');

    // 等待动画完成后隐藏弹窗
    setTimeout(() => {
      infoModal.style.display = 'none';
    }, 300);
  });
}

// 点击弹窗外部关闭弹窗
window.addEventListener('click', function (event) {
  if (event.target === infoModal) {
    // 移除show类触发动画
    infoModal.classList.remove('show');

    // 等待动画完成后隐藏弹窗
    setTimeout(() => {
      infoModal.style.display = 'none';
    }, 300);
  }
});

// 添加Escape键关闭弹窗
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && infoModal.style.display === 'flex') {
    // 移除show类触发动画
    infoModal.classList.remove('show');

    // 等待动画完成后隐藏弹窗
    setTimeout(() => {
      infoModal.style.display = 'none';
    }, 300);
  }
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

    // 重新获取引用
    inputField = document.getElementById('input-field');

    // 为新创建的输入框重新绑定事件
    inputField.addEventListener('input', handleInput);

    // 确保输入框始终可以接收输入
    inputField.style.pointerEvents = 'auto';

    // 当点击文本区域时，自动聚焦输入框
    textDisplay.addEventListener('click', () => {
      inputField.focus();
    });

    // 添加keydown事件监听以检测可能的中文输入开始
    inputField.addEventListener('keydown', (e) => {
      // 如果按下了可能触发中文输入的键
      if (!isComposing && e.key.length === 1 && /[\u4e00-\u9fa5a-zA-Z]/.test(e.key)) {
        potentialCompositionStart = true;
        // 移除setTimeout，改用事件检测方式
      }
    });

    // 添加额外的keyup事件以清除标志
    inputField.addEventListener('keyup', () => {
      // 如果keyup事件触发时仍然设置了潜在标志但没有进入组合状态，则重置
      if (potentialCompositionStart && !isComposing) {
        potentialCompositionStart = false;
      }
    });

    // 添加中文输入法支持
    inputField.addEventListener('compositionstart', () => {
      isComposing = true;
      potentialCompositionStart = false;
    });

    inputField.addEventListener('compositionend', () => {
      isComposing = false;
      if (inputField.value) {
        handleInput();
      }
      cursorAdapter.updatePosition();
    });
  }
}

function renderTokenizedContent(source) {
  if (!source) return;
  const tokens = source.tokens;
  const fragment = document.createDocumentFragment();
  let currentWord = null;

  const flushWord = () => {
    if (currentWord) {
      fragment.appendChild(currentWord);
      currentWord = null;
    }
  };

  const ensureWord = (language) => {
    if (!currentWord) {
      currentWord = document.createElement('span');
      currentWord.classList.add('word');
      if (language === 'english') {
        currentWord.classList.add('english-word');
      }
      if (language === 'chinese') {
        currentWord.classList.add('chinese-char');
      }
      currentWord.dataset.language = language || 'other';
    }
    return currentWord;
  };

  tokens.forEach((token) => {
    if (token.type === 'newline') {
      flushWord();
      const wrapper = document.createElement('span');
      wrapper.classList.add('word');
      const lineBreak = document.createElement('span');
      lineBreak.classList.add('line-break');
      lineBreak.setAttribute('data-char', '\n');
      wrapper.appendChild(lineBreak);
      fragment.appendChild(wrapper);
      fragment.appendChild(document.createElement('br'));
      return;
    }

    const shouldReuseWord =
      token.type === 'char' &&
      token.language === 'english' &&
      currentWord &&
      currentWord.dataset.language === 'english';

    if (!shouldReuseWord && !(token.attachToPrevious && currentWord)) {
      flushWord();
    }

    const word = token.attachToPrevious && currentWord ? currentWord : ensureWord(token.language);

    const span = createTokenSpan(token);
    word.appendChild(span);

    if (token.language === 'chinese' && token.type === 'char') {
      flushWord();
    }

    if (token.type === 'space' || token.type === 'punctuation') {
      flushWord();
    }
  });

  flushWord();
  textDisplay.innerHTML = '';
  textDisplay.appendChild(fragment);
}

function createTokenSpan(token) {
  if (token.type === 'space') {
    const wrapper = document.createElement('span');
    wrapper.classList.add(token.attachToPrevious ? 'no-break' : 'word-space');
    wrapper.setAttribute('data-char', ' ');
    const inner = document.createElement('span');
    inner.classList.add('char-space');
    inner.innerHTML = '&nbsp;';
    wrapper.appendChild(inner);
    return wrapper;
  }

  if (token.type === 'punctuation') {
    const punctuation = document.createElement('span');
    punctuation.setAttribute('data-char', token.char);
    punctuation.textContent = token.char;
    if (token.attachToPrevious) {
      punctuation.classList.add('no-break');
    }
    return punctuation;
  }

  const span = document.createElement('span');
  span.setAttribute('data-char', token.char);
  span.textContent = token.char;
  return span;
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

  renderTokenizedContent(currentSource);

  // 在设置新的内容前，清除现有的光标和输入框
  if (cursor) {
    cursor.remove();
    cursor = null;
  }
  cursorAdapter.resetAnimation();

  if (document.getElementById('input-field')) {
    document.getElementById('input-field').remove();
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

        if (allCharSpans.length === 0) {
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
      applySpanState(event.index, event.correct);
      updateStats();
      cursorAdapter.scheduleRefresh();
      break;
    case 'input:undo':
      resetSpanState(event.index);
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

function getSpanByIndex(index) {
  if (index == null) return null;
  if (index < 0 || index >= allCharSpans.length) return null;
  return allCharSpans[index];
}

function applySpanState(index, correct) {
  const span = getSpanByIndex(index);
  if (!span) return;
  span.classList.remove('correct', 'incorrect');
  span.classList.add(correct ? 'correct' : 'incorrect');
}

function resetSpanState(index) {
  const span = getSpanByIndex(index);
  if (!span) return;
  span.classList.remove('correct', 'incorrect');
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

// 修改handleInput函数，确保空格字符正确处理及光标精确定位
function handleInput() {
  // 如果是在中文输入法组合状态，不处理输入
  if (isComposing) return;

  // 如果可能是中文输入法的第一次按键，立即返回，避免进入复杂逻辑
  if (potentialCompositionStart) {
    // 保存当前输入值
    const currentValue = inputField.value;
    inputField.value = '';

    // 立即进行判断，避免使用requestAnimationFrame
    if (!isComposing && currentValue) {
      inputField.value = currentValue;
      // 强制设置标志位为false，避免递归调用
      const tempState = potentialCompositionStart;
      potentialCompositionStart = false;
      handleInput();
      // 恢复状态，避免影响后续输入
      potentialCompositionStart = tempState;
    }
    return;
  }

  // 获取输入框的值
  const inputChar = inputField.value;
  inputField.value = '';

  if (!inputChar || !typingSession) return;
  typingSession.input(inputChar);
}

function showResults() {
  if (!statsTracker || !statsPanel) return;

  const snapshot = statsTracker.getSnapshot();
  statsPanel.renderResults(snapshot);

  // 先显示弹窗
  resultModal.style.display = 'flex';

  // 使用requestAnimationFrame确保DOM更新后再添加show类
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      resultModal.classList.add('show');
    });
  });

  // 添加回车键监听
  document.addEventListener('keydown', handleResultsKeydown);
}

// 处理结果页面上的按键事件
function handleResultsKeydown(e) {
  // 如果按下回车键
  if (e.key === 'Enter') {
    // 移除事件监听器以避免重复
    document.removeEventListener('keydown', handleResultsKeydown);

    // 先移除show类来触发动画
    resultModal.classList.remove('show');

    // 等待动画完成后再隐藏弹窗并重新开始
    setTimeout(() => {
      resultModal.style.display = 'none';
      // 重新开始练习
      init();
    }, 300); // 与CSS中的过渡时间相匹配
  }
}

// 修改restart按钮的点击事件
restartBtn.addEventListener('click', function () {
  // 移除回车键监听器
  document.removeEventListener('keydown', handleResultsKeydown);

  // 触发动画
  resultModal.classList.remove('show');

  // 等待动画完成后再隐藏弹窗并重新开始
  setTimeout(() => {
    resultModal.style.display = 'none';
    // 重新开始练习
    init();
  }, 300); // 与CSS中的过渡时间相匹配
});

// 添加键盘事件监听，避免创建不必要的事件
document.addEventListener('keydown', (e) => {
  // 如果在结果页面则不处理
  if (resultModal.style.display === 'flex') return;

  // 确保输入框处于焦点状态
  if (document.activeElement !== inputField) {
    // 只阻止字符输入，避免阻止所有按键事件
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
      e.preventDefault();
    }

    // 直接聚焦，但不创建额外事件
    inputField.focus();
  }

  // 处理回车键（输入换行符）
  if (e.key === 'Enter') {
    e.preventDefault(); // 阻止默认行为

    if (!isComposing && typingSession) {
      typingSession.input('\n');
    }
  }

  // 如果按下回退键
  if (e.key === 'Backspace') {
    e.preventDefault(); // 阻止默认行为
    if (typingSession) {
      typingSession.undo();
    }
  }
});

// 添加window.onload事件处理
window.addEventListener('load', function () {
  // 页面完全加载后重新初始化光标位置
  if (allCharSpans.length > 0 && cursor && inputField) {
    cursorAdapter.updatePosition({ immediate: true });
    // 聚焦输入框
    inputField.focus();
  } else {
    // 如果还没有初始化，等待DOM更新
    requestAnimationFrame(() => {
      if (allCharSpans.length === 0) {
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
