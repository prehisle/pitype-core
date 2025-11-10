import { TypingSession, createStatsTracker, createTextSource } from './vendor/index.js';
import { initThemeSelector } from './ui/themeController.js';
import { initLanguageSelector, getActiveLanguage } from './ui/languageController.js';
import { createStatsPanel } from './ui/statsPanel.js';

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
let lastCursorY = 0;
let cursorUpdateScheduled = false;
let cursorAnimationFrameId = null;
let currentCursorMetrics = null;
let resizeObserver = null;
let resizeRefreshRaf = null;
let hasWindowResizeHandler = false;
const cursorAnimationPreferenceKey = 'cursorAnimationMode';
const cursorAnimationDurations = {
  off: 0,
  slow: 150,
  medium: 115,
  fast: 85
};
const cursorMinimums = {
  width: 2,
  height: 16,
  inputWidth: 30,
  widthMultiplier: 1.5
};
const reduceMotionQuery =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
const textLibrary = window.texts || [];
const getLocaleText =
  typeof window.getText === 'function' ? (key) => window.getText(key) : () => '';
const applyLanguageFn =
  typeof window.applyLanguage === 'function' ? (lang) => window.applyLanguage(lang) : () => {};
const updatePageTextFn =
  typeof window.updatePageText === 'function' ? () => window.updatePageText() : () => {};
const statsPanel = createStatsPanel({ getLocaleText });

const textContainer = document.querySelector('.text-container');
const textDisplay = document.getElementById('text-display');
// 移除初始引用，因为元素将被动态创建
// const inputField = document.getElementById('input-field');
const resultModal = document.getElementById('result-modal');
const restartBtn = document.getElementById('restart-btn');
const urlParams = new URLSearchParams(window.location.search);
const forcedTextIndexParam = urlParams.get('text');
const forcedTextIndex = forcedTextIndexParam !== null ? Number(forcedTextIndexParam) : null;

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

function getCursorAnimationDuration() {
  const stored = localStorage.getItem(cursorAnimationPreferenceKey);
  if (stored && stored in cursorAnimationDurations) {
    return cursorAnimationDurations[stored];
  }
  return cursorAnimationDurations.fast;
}

function shouldReduceMotion() {
  return !!(reduceMotionQuery && reduceMotionQuery.matches);
}

function lerp(from, to, progress) {
  return from + (to - from) * progress;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function cancelCursorAnimation() {
  if (cursorAnimationFrameId) {
    cancelAnimationFrame(cursorAnimationFrameId);
    cursorAnimationFrameId = null;
  }
}

function resetCursorAnimationState() {
  cancelCursorAnimation();
  currentCursorMetrics = null;
}

function applyCursorMetrics(metrics) {
  if (!cursor || !inputField) return;
  const snapshot = {
    left: metrics.left,
    top: metrics.top,
    width: metrics.width,
    height: metrics.height
  };

  cursor.style.width = `${snapshot.width}px`;
  cursor.style.height = `${snapshot.height}px`;
  cursor.style.transform = `translate3d(${snapshot.left}px, ${snapshot.top}px, 0)`;

  const inputWidth = Math.max(snapshot.width * cursorMinimums.widthMultiplier, cursorMinimums.inputWidth);
  inputField.style.width = `${inputWidth}px`;
  inputField.style.height = `${snapshot.height}px`;
  inputField.style.transform = `translate3d(${snapshot.left}px, ${snapshot.top}px, 0)`;

  currentCursorMetrics = snapshot;
}

function animateCursorTo(targetMetrics, options = { immediate: false }) {
  if (!cursor || !inputField) return;

  const duration = getCursorAnimationDuration();
  const skipAnimation =
    options.immediate || shouldReduceMotion() || duration === 0 || !currentCursorMetrics;

  cancelCursorAnimation();

  if (skipAnimation) {
    applyCursorMetrics(targetMetrics);
    return;
  }

  const from = { ...currentCursorMetrics };
  const target = { ...targetMetrics };
  const startTime = performance.now();

  const tick = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const eased = easeOutCubic(progress);

    const nextState = {
      left: lerp(from.left, target.left, eased),
      top: lerp(from.top, target.top, eased),
      width: lerp(from.width, target.width, eased),
      height: lerp(from.height, target.height, eased)
    };

    applyCursorMetrics(nextState);

    if (progress < 1) {
      cursorAnimationFrameId = requestAnimationFrame(tick);
    } else {
      cursorAnimationFrameId = null;
      applyCursorMetrics(target);
    }
  };

  cursorAnimationFrameId = requestAnimationFrame(tick);
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
  resetCursorAnimationState();

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
      updateCursorPosition();
    });
  }
}

function updateCursorPosition(options = { immediate: false }) {
  if (!cursor || !inputField || !textDisplay) return;

  if (allCharSpans.length === 0) {
    allCharSpans = document.querySelectorAll('#text-display span');
  }

  const currentPosition = getCurrentPosition();
  if (currentPosition < 0 || currentPosition >= allCharSpans.length) return;

  const currentChar = allCharSpans[currentPosition];
  if (!currentChar) return;

  const textRect = textDisplay.getBoundingClientRect();
  const charRect = currentChar.getBoundingClientRect();
  const top = charRect.top - textRect.top + textDisplay.scrollTop;
  const left = charRect.left - textRect.left + textDisplay.scrollLeft;
  const width = Math.max(charRect.width, cursorMinimums.width);
  const height = Math.max(charRect.height, cursorMinimums.height);

  animateCursorTo(
    {
      left,
      top,
      width,
      height
    },
    { immediate: options.immediate }
  );

  if (!cursor.classList.contains('cursor-visible')) {
    cursor.classList.add('cursor-visible');
  }

  const previousCursorY = lastCursorY;
  const currentCursorY = charRect.top;
  const isLineChange = previousCursorY !== 0 && Math.abs(currentCursorY - previousCursorY) > 5;

  if (isLineChange && textContainer) {
    const containerHeight = textContainer.clientHeight;
    textContainer.scrollTo({
      top: top - containerHeight / 2 + height / 2,
      behavior: 'smooth'
    });
    lastCursorY = currentCursorY;
  } else if (lastCursorY === 0) {
    lastCursorY = currentCursorY;
  }
}

function setupMobileSupport() {
  // 检测是否为移动设备
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  if (isMobile) {
    // 在文本显示区域添加点击事件，在移动设备上点击文本区可以触发虚拟键盘
    textDisplay.addEventListener('click', () => {
      inputField.focus();
    });
  }
}

function scheduleLayoutRefresh() {
  if (!cursor || !inputField) return;
  if (resizeRefreshRaf) return;
  resizeRefreshRaf = requestAnimationFrame(() => {
    resizeRefreshRaf = null;
    cacheAllCharSpans();
    lastCursorY = 0;
    updateCursorPosition({ immediate: true });
  });
}

function initResponsiveCursorSync() {
  const textContainer = document.querySelector('.text-container');
  if (!textContainer) return;

  if (!hasWindowResizeHandler) {
    window.addEventListener('resize', scheduleLayoutRefresh);
    hasWindowResizeHandler = true;
  }

  if (typeof ResizeObserver === 'undefined') {
    return;
  }

  if (!resizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      scheduleLayoutRefresh();
    });
  } else {
    resizeObserver.disconnect();
  }

  resizeObserver.observe(textContainer);
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
  resetCursorAnimationState();

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
        cacheAllCharSpans();

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
        updateCursorPosition({ immediate: true });

        // 设置移动设备支持
        setupMobileSupport();

        // 监听尺寸变化，保持光标位置随容器更新
        initResponsiveCursorSync();

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
      scheduleCursorRefresh();
      break;
    case 'input:undo':
      resetSpanState(event.index);
      updateStats();
      scheduleCursorRefresh();
      break;
    case 'session:complete':
      stopStatsTimer();
      updateStats();
      if (cursor) {
        cursor.remove();
        cursor = null;
      }
      resetCursorAnimationState();
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

function scheduleCursorRefresh() {
  if (cursorUpdateScheduled) return;
  cursorUpdateScheduled = true;
  requestAnimationFrame(() => {
    cursorUpdateScheduled = false;
    updateCursorPosition();
  });
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

// 预先缓存所有字符span元素，并确保排序正确
function cacheAllCharSpans() {
  allCharSpans = [];
  const wordSpans = textDisplay.querySelectorAll('.word');

  // 首先收集所有可能的字符元素
  wordSpans.forEach((wordSpan) => {
    // 处理直接子元素
    const charSpans = wordSpan.children;

    for (let i = 0; i < charSpans.length; i++) {
      const span = charSpans[i];

      // 检查是否为换行符元素
      if (span.classList.contains('line-break')) {
        allCharSpans.push({
          element: span,
          rect: span.getBoundingClientRect(),
          dataChar: '\n'
        });
        continue;
      }

      // 检查是否为带有嵌套空格的元素
      if (span.classList.contains('word-space') || span.classList.contains('no-break')) {
        // 对于包含空格的元素，将它们直接添加到数组中
        // 空格元素不会被拆分为内部子元素
        allCharSpans.push({
          element: span,
          rect: span.getBoundingClientRect(),
          dataChar: span.getAttribute('data-char') || ' '
        });
      }
      // 否则为普通字符元素，直接添加
      else if (span.getAttribute('data-char')) {
        allCharSpans.push({
          element: span,
          rect: span.getBoundingClientRect(),
          dataChar: span.getAttribute('data-char')
        });
      }
      // 普通单词容器，需要添加子元素
      else {
        const innerSpans = span.querySelectorAll('[data-char]');
        innerSpans.forEach((innerSpan) => {
          // 过滤掉嵌套在no-break内的字符
          if (
            !innerSpan.parentElement.classList.contains('word-space') &&
            !innerSpan.parentElement.classList.contains('no-break')
          ) {
            allCharSpans.push({
              element: innerSpan,
              rect: innerSpan.getBoundingClientRect(),
              dataChar: innerSpan.getAttribute('data-char')
            });
          }
        });
      }
    }
  });

  // 按照元素在页面上的顺序（从左到右，从上到下）排序
  // 这确保了光标始终按照正确的阅读顺序移动
  allCharSpans.sort((a, b) => {
    // 先按照y位置（行）排序
    const rowDiff = a.rect.top - b.rect.top;
    if (Math.abs(rowDiff) > 5) {
      // 如果y差值足够大，认为是不同行
      return rowDiff;
    }
    // 同一行按照x位置（从左到右）排序
    return a.rect.left - b.rect.left;
  });

  // 转换回纯元素数组，保留排序
  allCharSpans = allCharSpans.map((item) => item.element);
}

// 添加window.onload事件处理
window.addEventListener('load', function () {
  // 页面完全加载后重新初始化光标位置
  if (allCharSpans.length > 0 && cursor && inputField) {
    updateCursorPosition({ immediate: true });
    // 聚焦输入框
    inputField.focus();
  } else {
    // 如果还没有初始化，等待DOM更新
    requestAnimationFrame(() => {
      if (allCharSpans.length === 0) {
        cacheAllCharSpans();
      }
      if (cursor && inputField) {
        updateCursorPosition({ immediate: true });
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
