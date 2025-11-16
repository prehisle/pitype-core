import { __async, __spreadProps, __spreadValues } from './chunk-WDMUDEB6.js';

// ../../packages/pitype-core/dist/tokenizer.js
var ENGLISH_RE = /[A-Za-z0-9]/;
var CHINESE_RE = /[\u3400-\u9FBF]/;
var FULL_WIDTH_SPACE = '　';
var PUNCTUATION_SET = /* @__PURE__ */ new Set([
  ',',
  '.',
  '!',
  '?',
  ';',
  ':',
  '"',
  "'",
  '-',
  '_',
  '(',
  ')',
  '[',
  ']',
  '{',
  '}',
  '，',
  '。',
  '！',
  '？',
  '：',
  '；',
  '「',
  '」',
  '『',
  '』',
  '（',
  '）',
  '、',
  '—',
  '…',
  '·',
  '《',
  '》',
  '：',
  '！',
  '？'
]);
function tokenizeText(text) {
  const tokens = [];
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '\r') {
      continue;
    }
    if (char === '\n') {
      tokens.push({
        char,
        type: 'newline',
        language: 'separator',
        attachToPrevious: false
      });
      continue;
    }
    if (char === ' ' || char === FULL_WIDTH_SPACE) {
      tokens.push({
        char,
        type: 'space',
        language: 'separator',
        attachToPrevious: tokens.length > 0
      });
      continue;
    }
    if (PUNCTUATION_SET.has(char)) {
      tokens.push({
        char,
        type: 'punctuation',
        language: 'separator',
        attachToPrevious: tokens.length > 0
      });
      continue;
    }
    const language = CHINESE_RE.test(char)
      ? 'chinese'
      : ENGLISH_RE.test(char)
        ? 'english'
        : 'other';
    tokens.push({
      char,
      type: 'char',
      language,
      attachToPrevious: false
    });
  }
  return tokens;
}

// ../../packages/pitype-core/dist/textSource.js
var sourceCounter = 0;
function createTextSource(content, options = {}) {
  if (!content) {
    throw new Error('TextSource content must not be empty');
  }
  return {
    id: options.id ?? `text-${++sourceCounter}`,
    content,
    locale: options.locale,
    tokens: options.tokens ?? tokenizeText(content)
  };
}

// ../../packages/pitype-core/dist/typingSession.js
var TypingSession = class {
  constructor(options) {
    this.listeners = /* @__PURE__ */ new Set();
    this.entries = [];
    this.position = 0;
    this.completed = false;
    const source = options?.source ?? createTextSourceFromOptions(options);
    if (!source) {
      throw new Error('TypingSession requires text or source');
    }
    this.text = source.content;
    this.now = options.now ?? (() => Date.now());
    this.tokens = source.tokens;
    this.locale = source.locale;
    this.sourceId = source.id;
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  getState() {
    return {
      text: this.text,
      position: this.position,
      entries: [...this.entries],
      complete: this.completed,
      sourceId: this.sourceId,
      locale: this.locale
    };
  }
  isComplete() {
    return this.completed;
  }
  input(chars) {
    if (!chars) return;
    for (const char of chars) {
      if (this.position >= this.tokens.length) {
        this.completed = true;
        return;
      }
      if (this.startedAt === void 0) {
        this.startSession();
      }
      const expected = this.tokens[this.position]?.char ?? '';
      const timestamp = this.now();
      const correct = this.equalsInput(expected, char);
      const entry = {
        index: this.position,
        expected,
        actual: char,
        correct
      };
      this.entries.push(entry);
      this.position += 1;
      this.emit(
        __spreadValues(
          {
            type: 'input:evaluate',
            timestamp
          },
          entry
        )
      );
      if (this.position >= this.tokens.length) {
        this.completed = true;
        this.emit({
          type: 'session:complete',
          timestamp
        });
        return;
      }
    }
  }
  undo(count = 1) {
    if (count <= 0) return;
    while (count-- > 0 && this.entries.length > 0) {
      const entry = this.entries.pop();
      this.position = entry.index;
      this.completed = false;
      const timestamp = this.now();
      this.emit(
        __spreadValues(
          {
            type: 'input:undo',
            timestamp
          },
          entry
        )
      );
    }
  }
  reset() {
    this.entries = [];
    this.position = 0;
    this.completed = false;
    this.startedAt = void 0;
    this.emit({
      type: 'session:reset',
      timestamp: this.now()
    });
  }
  startSession() {
    this.startedAt = this.now();
    this.emit({
      type: 'session:start',
      timestamp: this.startedAt
    });
  }
  emit(event) {
    this.listeners.forEach((listener) => listener(event));
  }
  equalsInput(expected, actual) {
    if (expected === actual) return true;
    if (expected === '\n' && (actual === '\n' || actual === '\r')) return true;
    return false;
  }
};
function createTextSourceFromOptions(options) {
  if (!options?.text) return void 0;
  return createTextSource(options.text, {
    tokens: options.tokens
  });
}

// ../../packages/pitype-core/dist/statsTracker.js
function createStatsTracker(session) {
  return new StatsTrackerImpl(session);
}
var StatsTrackerImpl = class {
  constructor(session) {
    this.correctChars = 0;
    this.totalChars = 0;
    this.completed = false;
    session.subscribe((event) => this.handleEvent(event));
  }
  getSnapshot() {
    const durationMs = this.computeDuration();
    const minutes = durationMs > 0 ? durationMs / 6e4 : 0;
    return {
      startedAt: this.startedAt,
      durationMs,
      correctChars: this.correctChars,
      totalChars: this.totalChars,
      accuracy:
        this.totalChars === 0 ? 100 : Math.round((this.correctChars / this.totalChars) * 100),
      correctCpm: minutes > 0 ? Math.round(this.correctChars / minutes) : 0,
      totalCpm: minutes > 0 ? Math.round(this.totalChars / minutes) : 0,
      wpm: minutes > 0 ? Math.round(this.correctChars / minutes / 5) : 0,
      completed: this.completed
    };
  }
  handleEvent(event) {
    switch (event.type) {
      case 'session:start':
        this.startedAt = event.timestamp;
        this.lastTimestamp = event.timestamp;
        this.completed = false;
        this.correctChars = 0;
        this.totalChars = 0;
        break;
      case 'input:evaluate':
        this.lastTimestamp = event.timestamp;
        this.totalChars += 1;
        if (event.correct) this.correctChars += 1;
        break;
      case 'input:undo':
        this.lastTimestamp = event.timestamp;
        if (this.totalChars > 0) this.totalChars -= 1;
        if (event.correct && this.correctChars > 0) this.correctChars -= 1;
        this.completed = false;
        break;
      case 'session:complete':
        this.lastTimestamp = event.timestamp;
        this.completed = true;
        break;
      case 'session:reset':
        this.startedAt = void 0;
        this.lastTimestamp = void 0;
        this.totalChars = 0;
        this.correctChars = 0;
        this.completed = false;
        break;
    }
  }
  computeDuration() {
    if (this.startedAt === void 0) {
      return 0;
    }
    const last = this.lastTimestamp ?? this.startedAt;
    return Math.max(0, last - this.startedAt);
  }
};

// ../../packages/pitype-core/dist/recorder.js
function createRecorder(options = {}) {
  const { id: customId, includeMetadata = true, customMetadata = {} } = options;
  let recording = false;
  let _currentSession = null;
  let currentTextSource = null;
  let events = [];
  let startTime = 0;
  let unsubscribe = null;
  let recordingId = '';
  function generateId() {
    return customId || `recording-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  function start(session, textSource) {
    if (recording) {
      console.warn('Recording already in progress. Stop current recording first.');
      return;
    }
    recording = true;
    _currentSession = session;
    currentTextSource = textSource;
    events = [];
    startTime = Date.now();
    recordingId = generateId();
    unsubscribe = session.subscribe((event) => {
      if (recording) {
        events.push(__spreadValues({}, event));
      }
    });
  }
  function stop(finalStats) {
    if (!recording || !currentTextSource) {
      console.warn('No recording in progress.');
      return null;
    }
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    const endTime = Date.now();
    recording = false;
    const recordingData = {
      id: recordingId,
      textSource: currentTextSource,
      events: [...events],
      startTime,
      endTime,
      finalStats
    };
    if (includeMetadata) {
      recordingData.metadata = __spreadValues(
        {
          version: '1.0.0',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          duration: endTime - startTime,
          eventCount: events.length
        },
        customMetadata
      );
    }
    _currentSession = null;
    currentTextSource = null;
    events = [];
    return recordingData;
  }
  function isRecording() {
    return recording;
  }
  function getCurrentRecording() {
    if (!recording || !currentTextSource) {
      return null;
    }
    return {
      id: recordingId,
      textSource: currentTextSource,
      events: [...events],
      startTime,
      endTime: Date.now()
    };
  }
  function clear() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    recording = false;
    _currentSession = null;
    currentTextSource = null;
    events = [];
    startTime = 0;
    recordingId = '';
  }
  return {
    start,
    stop,
    isRecording,
    getCurrentRecording,
    clear
  };
}
function serializeRecording(recording) {
  return JSON.stringify(recording, null, 2);
}
function deserializeRecording(json) {
  return JSON.parse(json);
}
function exportRecordingToFile(recording, filename) {
  if (typeof window === 'undefined' || typeof Blob === 'undefined') {
    throw new Error('File export is only available in browser environments');
  }
  const json = serializeRecording(recording);
  const blob = new Blob([json], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${recording.id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function importRecordingFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result;
        const recording = deserializeRecording(json);
        resolve(recording);
      } catch (error) {
        reject(new Error(`Failed to parse recording file: ${error}`));
      }
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsText(file);
  });
}

// ../../packages/pitype-core/dist/sessionRuntime.js
function createSessionRuntime(options = {}) {
  const interval = options.snapshotIntervalMs ?? 1e3;
  const audioController = options.audioController;
  const enableRecording = options.enableRecording ?? false;
  const recorderOptions = options.recorderOptions;
  let typingSession = null;
  let statsTracker = null;
  let timer = null;
  let unsubscribe = null;
  let recorder = enableRecording ? createRecorder(recorderOptions) : null;
  let lastRecording = null;
  let currentTextSource = null;
  const getSnapshot = () => (statsTracker ? statsTracker.getSnapshot() : null);
  const notifySnapshot = () => {
    options.onSnapshot?.(getSnapshot());
  };
  const startTimer = () => {
    if (interval <= 0 || timer) return;
    timer = setInterval(() => {
      notifySnapshot();
    }, interval);
  };
  const stopTimer = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };
  const teardownSession = () => {
    stopTimer();
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    typingSession = null;
    statsTracker = null;
  };
  const handleSessionEvent = (event) => {
    switch (event.type) {
      case 'session:start':
        startTimer();
        notifySnapshot();
        break;
      case 'input:evaluate':
        options.onEvaluate?.(event);
        notifySnapshot();
        if (audioController) {
          audioController.playSound('keyPress');
          if (event.correct) {
            audioController.playSound('correct');
          } else {
            audioController.playSound('error');
          }
        }
        break;
      case 'input:undo':
        options.onUndo?.(event);
        notifySnapshot();
        break;
      case 'session:complete': {
        stopTimer();
        notifySnapshot();
        const finalSnapshot = getSnapshot();
        if (recorder && recorder.isRecording()) {
          lastRecording = recorder.stop(finalSnapshot || void 0);
        }
        options.onComplete?.(finalSnapshot);
        audioController?.playSound('complete');
        break;
      }
      case 'session:reset':
        stopTimer();
        notifySnapshot();
        options.onReset?.();
        if (recorder && recorder.isRecording()) {
          recorder.stop();
        }
        break;
    }
  };
  const dispose = () => {
    teardownSession();
    notifySnapshot();
  };
  const startSession = (input) => {
    teardownSession();
    const session = createSessionFromInput(input);
    typingSession = session;
    statsTracker = createStatsTracker(session);
    unsubscribe = session.subscribe(handleSessionEvent);
    currentTextSource = extractTextSource(input);
    if (recorder && currentTextSource) {
      recorder.start(session, currentTextSource);
    }
    notifySnapshot();
    return session;
  };
  return {
    startSession,
    dispose,
    getSession: () => typingSession,
    getLatestSnapshot: getSnapshot,
    getRecorder: () => recorder,
    getLastRecording: () => lastRecording,
    isRecording: () => recorder?.isRecording() ?? false
  };
}
function createSessionFromInput(input) {
  if (typeof input === 'string') {
    return new TypingSession({
      text: input
    });
  }
  if (typeof input === 'object' && 'content' in input && 'tokens' in input) {
    return new TypingSession({
      source: input
    });
  }
  return new TypingSession(input);
}
function extractTextSource(input) {
  if (typeof input === 'string') {
    return {
      content: input,
      tokens: tokenizeText(input),
      id: `text-${Date.now()}`,
      locale: 'en-US'
    };
  }
  if (typeof input === 'object' && 'content' in input && 'tokens' in input) {
    return input;
  }
  if (typeof input === 'object' && 'source' in input && input.source) {
    return input.source;
  }
  return null;
}

// ../../packages/pitype-core/dist/dom/inputController.js
var compositionTriggerPattern = /[\u4e00-\u9fa5a-zA-Z]/;
function createDomInputController(options = {}) {
  const {
    getTypingSession = () => null,
    isResultModalVisible = () => false,
    onCompositionEnd = () => {},
    documentRef = typeof document !== 'undefined' ? document : void 0,
    getActiveElement = () => (typeof document !== 'undefined' ? document.activeElement : null)
  } = options;
  let inputElement = null;
  let isComposing = false;
  let potentialCompositionStart = false;
  const handleInputEvent = () => {
    if (!inputElement || isComposing) return;
    if (potentialCompositionStart) {
      const currentValue = inputElement.value;
      inputElement.value = '';
      if (!isComposing && currentValue) {
        inputElement.value = currentValue;
        const tempState = potentialCompositionStart;
        potentialCompositionStart = false;
        handleInputEvent();
        potentialCompositionStart = tempState;
      }
      return;
    }
    const session = getTypingSession();
    if (!session) {
      inputElement.value = '';
      return;
    }
    const inputChar = inputElement.value;
    inputElement.value = '';
    if (!inputChar) return;
    session.input(inputChar);
  };
  const handlePotentialCompositionKeydown = (event) => {
    if (
      !isComposing &&
      typeof event.key === 'string' &&
      event.key.length === 1 &&
      compositionTriggerPattern.test(event.key)
    ) {
      potentialCompositionStart = true;
    }
  };
  const handlePotentialCompositionKeyup = () => {
    if (potentialCompositionStart && !isComposing) {
      potentialCompositionStart = false;
    }
  };
  const handleCompositionStart = () => {
    isComposing = true;
    potentialCompositionStart = false;
  };
  const handleCompositionEnd = () => {
    isComposing = false;
    if (inputElement && inputElement.value) {
      handleInputEvent();
    }
    onCompositionEnd();
  };
  const focusInput = (focusOptions) => {
    if (!inputElement) return;
    if (typeof inputElement.focus === 'function') {
      inputElement.focus(
        focusOptions ?? {
          preventScroll: true
        }
      );
    }
  };
  const handleDocumentKeydown = (event) => {
    if (isResultModalVisible() || !inputElement) return;
    const session = getTypingSession();
    if (!session) return;
    const key = typeof event.key === 'string' ? event.key : '';
    const isCharacterOperation = key.length === 1 || key === 'Backspace' || key === 'Enter';
    if (isCharacterOperation && getActiveElement() !== inputElement) {
      event.preventDefault?.();
      focusInput();
    }
    if (key === 'Enter') {
      event.preventDefault?.();
      if (!isComposing) {
        session.input('\n');
      }
      return;
    }
    if (key === 'Backspace') {
      event.preventDefault?.();
      session.undo();
    }
  };
  const attachInput = (element) => {
    detachInput();
    if (!element) return;
    inputElement = element;
    inputElement.addEventListener('input', handleInputEvent);
    inputElement.addEventListener('keydown', handlePotentialCompositionKeydown);
    inputElement.addEventListener('keyup', handlePotentialCompositionKeyup);
    inputElement.addEventListener('compositionstart', handleCompositionStart);
    inputElement.addEventListener('compositionend', handleCompositionEnd);
  };
  const detachInput = () => {
    if (!inputElement) return;
    inputElement.removeEventListener('input', handleInputEvent);
    inputElement.removeEventListener('keydown', handlePotentialCompositionKeydown);
    inputElement.removeEventListener('keyup', handlePotentialCompositionKeyup);
    inputElement.removeEventListener('compositionstart', handleCompositionStart);
    inputElement.removeEventListener('compositionend', handleCompositionEnd);
    inputElement = null;
    potentialCompositionStart = false;
    isComposing = false;
  };
  documentRef?.addEventListener('keydown', handleDocumentKeydown);
  const destroy = () => {
    detachInput();
    documentRef?.removeEventListener('keydown', handleDocumentKeydown);
  };
  return {
    attachInput,
    detachInput,
    focusInput,
    destroy
  };
}

// ../../packages/pitype-core/dist/dom/statsPanel.js
var EMPTY_SNAPSHOT = {
  correctCpm: 0,
  totalCpm: 0,
  wpm: 0,
  accuracy: 100,
  durationMs: 0,
  totalChars: 0
};
function createDomStatsPanel({ getLocaleText, realtime = {}, result = {} } = {}) {
  const secondsLabel = () => getLocaleText?.('ui.statsLabels.seconds') || '秒';
  return {
    renderSnapshot: (snapshot) =>
      renderRealtime(snapshot ?? EMPTY_SNAPSHOT, realtime, secondsLabel),
    renderResults: (snapshot) => renderResults(snapshot ?? EMPTY_SNAPSHOT, result, secondsLabel),
    reset: () => renderRealtime(EMPTY_SNAPSHOT, realtime, secondsLabel)
  };
}
function renderRealtime(snapshot, elements, label) {
  setText(elements.cpm, formatNumber(snapshot.correctCpm));
  setText(elements.totalCpm, formatNumber(snapshot.totalCpm));
  setText(elements.wpm, formatNumber(snapshot.wpm));
  setText(elements.accuracy, `${formatNumber(snapshot.accuracy, 100)}%`);
  setText(elements.time, formatDuration(snapshot.durationMs, label));
  setText(elements.chars, formatNumber(snapshot.totalChars));
}
function renderResults(snapshot, elements, label) {
  setText(elements.time, formatDuration(snapshot.durationMs, label));
  setText(elements.cpm, formatNumber(snapshot.correctCpm));
  setText(elements.totalCpm, formatNumber(snapshot.totalCpm));
  setText(elements.wpm, formatNumber(snapshot.wpm));
  setText(elements.accuracy, `${formatNumber(snapshot.accuracy, 100)}%`);
  setText(elements.chars, formatNumber(snapshot.totalChars));
}
function setText(node, value) {
  if (!node) return;
  node.textContent = String(value);
}
function formatNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}
function formatDuration(durationMs, secondsLabel) {
  const elapsedSeconds = Math.max(0, durationMs) / 1e3;
  return `${elapsedSeconds.toFixed(1).padStart(6, ' ')}${secondsLabel()}`;
}

// ../../packages/pitype-core/dist/dom/themeController.js
var DEFAULT_THEMES = ['dracula', 'serika', 'botanical', 'aether', 'nord'];
function createDomThemeController(options = {}) {
  const documentRef = options.documentRef ?? (typeof document !== 'undefined' ? document : void 0);
  const storage = options.storage ?? (typeof localStorage !== 'undefined' ? localStorage : void 0);
  const selector = options.selector ?? '.theme-option';
  const target = options.target ?? (typeof document !== 'undefined' ? document.body : void 0);
  const themes = normalizeThemes(options.themes);
  const defaultTheme = normalizeDefaultTheme(options.defaultTheme, themes);
  const storageKey = options.storageKey ?? 'theme';
  let mountedElements = [];
  let activeTheme = getStoredTheme();
  function getStoredTheme() {
    const stored = storage?.getItem(storageKey);
    return isValidTheme(stored, themes) ? stored : defaultTheme;
  }
  function persistTheme(theme) {
    storage?.setItem(storageKey, theme);
  }
  function getThemeElements() {
    if (!documentRef || typeof documentRef.querySelectorAll !== 'function') {
      return [];
    }
    const nodes = documentRef.querySelectorAll(selector);
    return Array.from(nodes);
  }
  function applyThemeInternal(theme) {
    const normalized = isValidTheme(theme, themes) ? theme : defaultTheme;
    if (target?.classList) {
      themes.forEach((name) => target.classList.remove(`theme-${name}`));
      if (normalized !== defaultTheme) {
        target.classList.add(`theme-${normalized}`);
      }
    }
    options.onThemeChange?.(normalized);
    return normalized;
  }
  function syncActiveClass(elements, theme) {
    elements.forEach((element) => {
      const itemTheme = element.getAttribute?.('data-theme');
      if (!itemTheme || !element.classList) return;
      if (itemTheme === theme) {
        element.classList.add('active');
      } else {
        element.classList.remove('active');
      }
    });
  }
  function applyThemePublic(theme) {
    activeTheme = applyThemeInternal(theme);
    persistTheme(activeTheme);
    if (mountedElements.length === 0) {
      mountedElements = getThemeElements();
    }
    syncActiveClass(mountedElements, activeTheme);
    return activeTheme;
  }
  function init() {
    mountedElements = getThemeElements();
    activeTheme = applyThemeInternal(getStoredTheme());
    syncActiveClass(mountedElements, activeTheme);
    const listeners = mountedElements.map((element) => {
      const handler = () => {
        const theme = element.getAttribute?.('data-theme') ?? void 0;
        if (!theme || theme === activeTheme) return;
        activeTheme = applyThemeInternal(theme);
        persistTheme(activeTheme);
        syncActiveClass(mountedElements, activeTheme);
      };
      element.addEventListener?.('click', handler);
      return () => element.removeEventListener?.('click', handler);
    });
    return () => {
      listeners.forEach((unsubscribe) => unsubscribe());
      mountedElements = [];
    };
  }
  return {
    getActiveTheme: () => activeTheme,
    applyTheme: applyThemePublic,
    init
  };
}
function normalizeThemes(themes) {
  if (themes && themes.length > 0) {
    return Array.from(new Set(themes));
  }
  return [...DEFAULT_THEMES];
}
function normalizeDefaultTheme(defaultTheme, themes) {
  if (defaultTheme && isValidTheme(defaultTheme, themes)) {
    return defaultTheme;
  }
  return themes[0];
}
function isValidTheme(theme, themes) {
  if (!theme) return false;
  return themes.includes(theme);
}

// ../../packages/pitype-core/dist/dom/textRenderer.js
var DEFAULT_ATTACH_TO_PREVIOUS = /* @__PURE__ */ new Set([
  '，',
  '。',
  '！',
  '？',
  '：',
  '；',
  '、',
  '）',
  '】',
  '》',
  '』',
  '」',
  '’',
  '”',
  '…',
  '—'
]);
var DEFAULT_ATTACH_TO_NEXT = /* @__PURE__ */ new Set(['（', '【', '《', '『', '「', '“', '‘']);
function createDomTextRenderer(textDisplay, options = {}) {
  const doc = options.documentRef ?? (typeof document !== 'undefined' ? document : void 0);
  const preserveChildren = options.preserveChildren ?? false;
  const textContentClass = options.textContentClass ?? 'pitype-text-content';
  const normalizedLineBreakOptions = normalizeLineBreakOptions(options.lineBreakOptions);
  const shouldApplyLineBreakRules = hasLineBreakRules(normalizedLineBreakOptions);
  let charSpans = [];
  const render = (source) => {
    if (!textDisplay || !source || !doc) return;
    const tokens = source.tokens ?? [];
    const fragment = doc.createDocumentFragment();
    let currentWord = null;
    const lineBreakDecisions = shouldApplyLineBreakRules
      ? computeLineBreakDecisions(tokens, normalizedLineBreakOptions)
      : [];
    const flushWord = () => {
      if (currentWord) {
        fragment.appendChild(currentWord);
        currentWord = null;
      }
    };
    const ensureWord = (language) => {
      if (!currentWord) {
        currentWord = doc.createElement('span');
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
    let previousRenderableSpan = null;
    let pendingAttachToNext = false;
    tokens.forEach((token, index) => {
      if (token.type === 'newline') {
        flushWord();
        const wrapper = doc.createElement('span');
        wrapper.classList.add('word');
        const lineBreak = doc.createElement('span');
        lineBreak.classList.add('line-break');
        lineBreak.setAttribute('data-char', '\n');
        wrapper.appendChild(lineBreak);
        fragment.appendChild(wrapper);
        fragment.appendChild(doc.createElement('br'));
        if (shouldApplyLineBreakRules) {
          previousRenderableSpan = null;
          pendingAttachToNext = false;
        }
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
      const previousSpan = shouldApplyLineBreakRules ? previousRenderableSpan : null;
      const span = createTokenSpan(token, doc);
      word.appendChild(span);
      let currentDecision;
      let nextDecision;
      if (shouldApplyLineBreakRules) {
        currentDecision = lineBreakDecisions[index];
        nextDecision = lineBreakDecisions[index + 1];
        if (pendingAttachToNext && previousSpan) {
          applyNoBreak(previousSpan, span);
        }
        pendingAttachToNext = false;
        if (currentDecision?.attachToPrevious && previousSpan) {
          applyNoBreak(previousSpan, span);
        }
        if (currentDecision?.attachToNext) {
          pendingAttachToNext = true;
        }
      }
      const shouldKeepWordForNext =
        shouldApplyLineBreakRules &&
        Boolean(currentDecision?.attachToNext || nextDecision?.attachToPrevious);
      const shouldFlushChineseChar =
        token.language === 'chinese' &&
        token.type === 'char' &&
        (!shouldApplyLineBreakRules || !shouldKeepWordForNext);
      const shouldFlushSpace = token.type === 'space';
      const shouldFlushPunctuation =
        token.type === 'punctuation' && !(shouldApplyLineBreakRules && shouldKeepWordForNext);
      if (shouldFlushChineseChar) {
        flushWord();
      }
      if (shouldFlushSpace || shouldFlushPunctuation) {
        flushWord();
      }
      if (shouldApplyLineBreakRules) {
        previousRenderableSpan = span;
      }
    });
    flushWord();
    const contentWrapper = doc.createElement('div');
    contentWrapper.classList.add(textContentClass);
    contentWrapper.appendChild(fragment);
    if (preserveChildren) {
      const existing = Array.from(textDisplay.querySelectorAll(`.${textContentClass}`));
      existing.forEach((node) => node.remove());
      textDisplay.insertBefore(contentWrapper, textDisplay.firstChild);
    } else {
      textDisplay.innerHTML = '';
      textDisplay.appendChild(contentWrapper);
    }
    charSpans = [];
  };
  const setSpans = (spans = []) => {
    charSpans = Array.isArray(spans) ? spans : [];
  };
  const getSpans = () => charSpans;
  const getSpanByIndex = (index) => {
    if (index == null || index < 0 || index >= charSpans.length) return null;
    return charSpans[index];
  };
  const applySpanState = (index, correct) => {
    const span = getSpanByIndex(index);
    if (!span) return;
    span.classList.remove('correct', 'incorrect');
    span.classList.add(correct ? 'correct' : 'incorrect');
  };
  const resetSpanState = (index) => {
    const span = getSpanByIndex(index);
    if (!span) return;
    span.classList.remove('correct', 'incorrect');
  };
  return {
    render,
    setSpans,
    getSpans,
    applySpanState,
    resetSpanState
  };
}
function createTokenSpan(token, doc) {
  if (token.type === 'space') {
    const wrapper = doc.createElement('span');
    wrapper.classList.add(token.attachToPrevious ? 'no-break' : 'word-space');
    wrapper.setAttribute('data-char', ' ');
    const inner = doc.createElement('span');
    inner.classList.add('char-space');
    inner.innerHTML = '&nbsp;';
    wrapper.appendChild(inner);
    return wrapper;
  }
  if (token.type === 'punctuation') {
    const punctuation = doc.createElement('span');
    punctuation.setAttribute('data-char', token.char);
    punctuation.textContent = token.char;
    if (token.attachToPrevious) {
      punctuation.classList.add('no-break');
    }
    return punctuation;
  }
  const span = doc.createElement('span');
  span.setAttribute('data-char', token.char);
  span.textContent = token.char;
  return span;
}
function computeLineBreakDecisions(tokens, options) {
  const decisions = new Array(tokens.length);
  let previousRenderableToken;
  tokens.forEach((token, index) => {
    if (token.type === 'newline') {
      decisions[index] = void 0;
      previousRenderableToken = void 0;
      return;
    }
    const decision = evaluateLineBreakDecision(
      {
        token,
        index,
        tokens,
        previousToken: previousRenderableToken,
        nextToken: tokens[index + 1]
      },
      options
    );
    decisions[index] = decision;
    previousRenderableToken = token;
  });
  return decisions;
}
function normalizeLineBreakOptions(options) {
  const attachToPreviousChars = new Set(options?.attachToPreviousChars ?? []);
  const attachToNextChars = new Set(options?.attachToNextChars ?? []);
  if (!options?.disableDefaultCjk) {
    DEFAULT_ATTACH_TO_PREVIOUS.forEach((char) => attachToPreviousChars.add(char));
    DEFAULT_ATTACH_TO_NEXT.forEach((char) => attachToNextChars.add(char));
  }
  return {
    attachToPreviousChars,
    attachToNextChars,
    matchers: options?.matchers ?? []
  };
}
function hasLineBreakRules(options) {
  return (
    options.attachToPreviousChars.size > 0 ||
    options.attachToNextChars.size > 0 ||
    options.matchers.length > 0
  );
}
function evaluateLineBreakDecision(context, options) {
  let decision;
  if (options.attachToPreviousChars.has(context.token.char)) {
    decision = __spreadProps(__spreadValues({}, decision ?? {}), {
      attachToPrevious: true
    });
  }
  if (options.attachToNextChars.has(context.token.char)) {
    decision = __spreadProps(__spreadValues({}, decision ?? {}), {
      attachToNext: true
    });
  }
  for (const matcher of options.matchers) {
    const result = matcher(context);
    if (!result) continue;
    decision = {
      attachToPrevious: decision?.attachToPrevious || result.attachToPrevious,
      attachToNext: decision?.attachToNext || result.attachToNext
    };
  }
  return decision;
}
function applyNoBreak(previousSpan, currentSpan) {
  previousSpan.classList.add('no-break');
  currentSpan.classList.add('no-break');
}

// ../../packages/pitype-core/dist/dom/cursorAdapter.js
var cursorAnimationPreferenceKey = 'cursorAnimationMode';
var cursorShapePreferenceKey = 'cursorShape';
var cursorColorPreferenceKey = 'cursorColor';
var cursorBlinkPreferenceKey = 'cursorBlinkEnabled';
var cursorAnimationDurations = {
  off: 0,
  slow: 150,
  medium: 115,
  fast: 85
};
var cursorMinimums = {
  width: 2,
  height: 16,
  inputWidth: 30,
  widthMultiplier: 1.5
};
var cursorShapeDefaults = {
  block: {
    widthMultiplier: 1,
    heightMultiplier: 1
  },
  line: {
    widthMultiplier: 0.15,
    heightMultiplier: 1
  },
  underline: {
    widthMultiplier: 1,
    heightMultiplier: 0.15
  },
  outline: {
    widthMultiplier: 1,
    heightMultiplier: 1
  }
};
var mobileUserAgentPattern = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
function createDomCursorAdapter(options) {
  const {
    textDisplay,
    textContainer,
    getCurrentPosition,
    getCursor,
    getInput,
    getSpans = () => [],
    setSpans = () => {},
    windowRef = typeof window !== 'undefined' ? window : void 0,
    documentRef = typeof document !== 'undefined' ? document : void 0,
    navigatorRef = typeof navigator !== 'undefined' ? navigator : void 0,
    requestAnimationFrame: requestAnimationFrameImpl = (cb) =>
      windowRef?.requestAnimationFrame ? windowRef.requestAnimationFrame(cb) : (cb(Date.now()), 0),
    cancelAnimationFrame: cancelAnimationFrameImpl = (handle) =>
      windowRef?.cancelAnimationFrame?.(handle),
    performanceNow = () => windowRef?.performance?.now?.() ?? Date.now(),
    localStorage: localStorage2 = windowRef?.localStorage,
    resizeObserverCtor = typeof ResizeObserver !== 'undefined' ? ResizeObserver : void 0,
    cursorShape: initialCursorShape,
    cursorColor: initialCursorColor,
    cursorBlinkEnabled: initialCursorBlinkEnabled,
    cursorBlinkRate = 530
  } = options;
  let cursorUpdateScheduled = false;
  let cursorAnimationFrameId = null;
  let currentCursorMetrics = null;
  let lastCursorY = 0;
  let resizeObserver = null;
  let resizeRefreshRaf = null;
  let hasWindowResizeHandler = false;
  let mobileSupportAttached = false;
  let currentCursorShape = loadCursorShape();
  let currentCursorColor = loadCursorColor();
  let currentCursorBlinkEnabled = loadCursorBlinkEnabled();
  function loadCursorShape() {
    if (initialCursorShape) return initialCursorShape;
    const stored = localStorage2?.getItem(cursorShapePreferenceKey);
    if (
      stored &&
      (stored === 'block' || stored === 'line' || stored === 'underline' || stored === 'outline')
    ) {
      return stored;
    }
    return 'block';
  }
  function loadCursorColor() {
    if (initialCursorColor) return initialCursorColor;
    return localStorage2?.getItem(cursorColorPreferenceKey) || null;
  }
  function loadCursorBlinkEnabled() {
    if (initialCursorBlinkEnabled !== void 0) return initialCursorBlinkEnabled;
    const stored = localStorage2?.getItem(cursorBlinkPreferenceKey);
    if (stored !== null) return stored === 'true';
    return false;
  }
  function applyCursorStyle(cursor) {
    cursor.classList.remove('cursor-block', 'cursor-line', 'cursor-underline', 'cursor-outline');
    cursor.classList.add(`cursor-${currentCursorShape}`);
    if (currentCursorColor) {
      if (currentCursorShape === 'outline') {
        cursor.style.borderColor = currentCursorColor;
        cursor.style.backgroundColor = 'transparent';
      } else {
        cursor.style.backgroundColor = currentCursorColor;
      }
    } else {
      cursor.style.backgroundColor = '';
      cursor.style.borderColor = '';
    }
    if (currentCursorBlinkEnabled) {
      cursor.style.animation = `cursor-blink ${cursorBlinkRate}ms step-end infinite`;
    } else {
      cursor.style.animation = '';
    }
  }
  function cacheCharSpans() {
    if (!textDisplay || !documentRef) {
      setSpans([]);
      return [];
    }
    const wordSpans = textDisplay.querySelectorAll?.('.word') ?? [];
    const measured = [];
    wordSpans.forEach((wordSpan) => {
      const children = wordSpan.children ?? [];
      for (let i = 0; i < children.length; i++) {
        const span = children[i];
        if (span.classList?.contains('line-break')) {
          measured.push({
            element: span,
            rect: span.getBoundingClientRect(),
            dataChar: '\n'
          });
          continue;
        }
        if (span.classList?.contains('word-space') || span.classList?.contains('no-break')) {
          measured.push({
            element: span,
            rect: span.getBoundingClientRect(),
            dataChar: span.getAttribute('data-char') || ' '
          });
        } else if (span.getAttribute?.('data-char')) {
          measured.push({
            element: span,
            rect: span.getBoundingClientRect(),
            dataChar: span.getAttribute('data-char')
          });
        } else {
          const innerSpans = span.querySelectorAll?.('[data-char]') ?? [];
          innerSpans.forEach((innerSpan) => {
            const htmlSpan = innerSpan;
            if (
              !htmlSpan.parentElement?.classList?.contains('word-space') &&
              !htmlSpan.parentElement?.classList?.contains('no-break')
            ) {
              measured.push({
                element: htmlSpan,
                rect: htmlSpan.getBoundingClientRect(),
                dataChar: htmlSpan.getAttribute('data-char')
              });
            }
          });
        }
      }
    });
    measured.sort((a, b) => {
      const rowDiff = a.rect.top - b.rect.top;
      if (Math.abs(rowDiff) > 5) {
        return rowDiff;
      }
      return a.rect.left - b.rect.left;
    });
    const ordered = measured.map((item) => item.element);
    setSpans(Array.from(ordered));
    return ordered;
  }
  function scheduleRefresh() {
    if (cursorUpdateScheduled) return;
    cursorUpdateScheduled = true;
    requestAnimationFrameImpl(() => {
      cursorUpdateScheduled = false;
      updatePosition({
        immediate: false
      });
    });
  }
  function updatePosition(
    options2 = {
      immediate: false
    }
  ) {
    const cursor = getCursor();
    const input = getInput();
    if (!cursor || !input || !textDisplay) return;
    if (typeof textDisplay.contains === 'function') {
      if (!textDisplay.contains(cursor)) {
        textDisplay.appendChild(cursor);
        if (typeof console !== 'undefined' && console.warn) {
          console.warn(
            '[pitype-core] DomCursorAdapter: 光标元素已自动移动到 textDisplay 内部。建议在创建光标时直接使用 textDisplay.appendChild(cursor) 来避免此警告。'
          );
        }
      }
      if (!textDisplay.contains(input)) {
        textDisplay.appendChild(input);
        if (typeof console !== 'undefined' && console.warn) {
          console.warn(
            '[pitype-core] DomCursorAdapter: 输入框元素已自动移动到 textDisplay 内部。建议在创建输入框时直接使用 textDisplay.appendChild(input) 来避免此警告。'
          );
        }
      }
    }
    let spans = getSpans();
    if (!spans || spans.length === 0) {
      spans = cacheCharSpans();
    }
    const position = getCurrentPosition();
    if (position < 0 || position >= spans.length) return;
    const currentChar = spans[position];
    if (!currentChar) return;
    const textRect = textDisplay.getBoundingClientRect();
    const charRect = currentChar.getBoundingClientRect();
    const top = charRect.top - textRect.top + (textDisplay.scrollTop ?? 0);
    const left = charRect.left - textRect.left + (textDisplay.scrollLeft ?? 0);
    const width = Math.max(charRect.width, cursorMinimums.width);
    const height = Math.max(charRect.height, cursorMinimums.height);
    animateCursorTo(
      {
        left,
        top,
        width,
        height
      },
      {
        immediate: options2.immediate ?? false
      },
      cursor,
      input
    );
    if (!cursor.classList.contains('cursor-visible')) {
      cursor.classList.add('cursor-visible');
    }
    const previousCursorY = lastCursorY;
    const currentCursorY = charRect.top;
    const isLineChange = previousCursorY !== 0 && Math.abs(currentCursorY - previousCursorY) > 5;
    if (isLineChange && textContainer?.scrollTo) {
      const containerHeight = textContainer.clientHeight ?? 0;
      textContainer.scrollTo({
        top: top - containerHeight / 2 + height / 2,
        behavior: 'smooth'
      });
      lastCursorY = currentCursorY;
    } else if (lastCursorY === 0) {
      lastCursorY = currentCursorY;
    }
  }
  function resetAnimation() {
    if (cursorAnimationFrameId !== null) {
      cancelAnimationFrameImpl?.(cursorAnimationFrameId);
      cursorAnimationFrameId = null;
    }
    currentCursorMetrics = null;
  }
  function scheduleLayoutRefresh() {
    if (resizeRefreshRaf !== null) return;
    resizeRefreshRaf = requestAnimationFrameImpl(() => {
      resizeRefreshRaf = null;
      cacheCharSpans();
      lastCursorY = 0;
      updatePosition({
        immediate: true
      });
    });
  }
  function enableResponsiveSync() {
    if (hasWindowResizeHandler || !textContainer || !windowRef) return;
    const handler = scheduleLayoutRefresh;
    windowRef.addEventListener?.('resize', handler);
    hasWindowResizeHandler = true;
    if (resizeObserverCtor) {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      resizeObserver = new resizeObserverCtor(() => {
        scheduleLayoutRefresh();
      });
      resizeObserver.observe(textContainer);
    }
  }
  function enableMobileSupport() {
    if (mobileSupportAttached || !textDisplay) return;
    if (navigatorRef && mobileUserAgentPattern.test(navigatorRef.userAgent ?? '')) {
      textDisplay.addEventListener?.('click', () => {
        const input = getInput();
        input?.focus?.();
      });
    }
    mobileSupportAttached = true;
  }
  function applyCursorMetrics(metrics, cursor, input) {
    const shapeConfig = cursorShapeDefaults[currentCursorShape];
    const adjustedWidth = metrics.width * shapeConfig.widthMultiplier;
    const adjustedHeight = metrics.height * shapeConfig.heightMultiplier;
    let adjustedTop = metrics.top;
    if (currentCursorShape === 'underline') {
      adjustedTop = metrics.top + metrics.height - adjustedHeight;
    }
    cursor.style.width = `${adjustedWidth}px`;
    cursor.style.height = `${adjustedHeight}px`;
    cursor.style.transform = `translate3d(${metrics.left}px, ${adjustedTop}px, 0)`;
    applyCursorStyle(cursor);
    const inputWidth = Math.max(
      metrics.width * cursorMinimums.widthMultiplier,
      cursorMinimums.inputWidth
    );
    input.style.width = `${inputWidth}px`;
    input.style.height = `${metrics.height}px`;
    input.style.transform = `translate3d(${metrics.left}px, ${metrics.top}px, 0)`;
    currentCursorMetrics = __spreadValues({}, metrics);
  }
  function animateCursorTo(targetMetrics, options2, cursor, input) {
    const duration = getCursorAnimationDuration();
    const skipAnimation =
      options2.immediate || shouldReduceMotion() || duration === 0 || !currentCursorMetrics;
    if (cursorAnimationFrameId !== null) {
      cancelAnimationFrameImpl?.(cursorAnimationFrameId);
      cursorAnimationFrameId = null;
    }
    if (skipAnimation) {
      applyCursorMetrics(targetMetrics, cursor, input);
      return;
    }
    const from = __spreadValues({}, currentCursorMetrics);
    const target = __spreadValues({}, targetMetrics);
    const startTime = performanceNow();
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
      applyCursorMetrics(nextState, cursor, input);
      if (progress < 1) {
        cursorAnimationFrameId = requestAnimationFrameImpl(tick);
      } else {
        cursorAnimationFrameId = null;
        applyCursorMetrics(target, cursor, input);
      }
    };
    cursorAnimationFrameId = requestAnimationFrameImpl(tick);
  }
  function getCursorAnimationDuration() {
    const stored = localStorage2?.getItem(cursorAnimationPreferenceKey);
    if (stored && stored in cursorAnimationDurations) {
      return cursorAnimationDurations[stored];
    }
    return cursorAnimationDurations.fast;
  }
  function shouldReduceMotion() {
    const reduceMotionQuery = windowRef?.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;
    return !!reduceMotionQuery?.matches;
  }
  function setCursorShape(shape) {
    currentCursorShape = shape;
    localStorage2?.setItem(cursorShapePreferenceKey, shape);
    const cursor = getCursor();
    if (cursor) {
      applyCursorStyle(cursor);
      updatePosition({
        immediate: true
      });
    }
  }
  function setCursorColor(color) {
    currentCursorColor = color;
    localStorage2?.setItem(cursorColorPreferenceKey, color);
    const cursor = getCursor();
    if (cursor) applyCursorStyle(cursor);
  }
  function setCursorBlink(enabled) {
    currentCursorBlinkEnabled = enabled;
    localStorage2?.setItem(cursorBlinkPreferenceKey, String(enabled));
    const cursor = getCursor();
    if (cursor) applyCursorStyle(cursor);
  }
  function getCursorShape() {
    return currentCursorShape;
  }
  function getCursorColor() {
    return currentCursorColor;
  }
  function getCursorBlink() {
    return currentCursorBlinkEnabled;
  }
  function initialize(opts = {}) {
    const { enableMobile = true, enableResponsive = true } = opts;
    resetAnimation();
    updatePosition({
      immediate: true
    });
    if (enableMobile) {
      enableMobileSupport();
    }
    if (enableResponsive) {
      enableResponsiveSync();
    }
  }
  return {
    initialize,
    cacheCharSpans,
    updatePosition,
    resetAnimation,
    scheduleRefresh,
    scheduleLayoutRefresh,
    enableResponsiveSync,
    enableMobileSupport,
    setCursorShape,
    setCursorColor,
    setCursorBlink,
    getCursorShape,
    getCursorColor,
    getCursorBlink
  };
}
function lerp(from, to, progress) {
  return from + (to - from) * progress;
}
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// ../../packages/pitype-core/dist/dom/audioController.js
var audioEnabledKey = 'audioEnabled';
var audioVolumeKey = 'audioVolume';
function createDomAudioController(options = {}) {
  const {
    soundPack: initialSoundPack = {},
    enabled: initialEnabled,
    volume: initialVolume,
    poolSize = 3,
    localStorage: localStorage2 = typeof window !== 'undefined' ? window.localStorage : void 0,
    windowRef = typeof window !== 'undefined' ? window : void 0
  } = options;
  const audioPools = /* @__PURE__ */ new Map();
  let currentSoundPack = __spreadValues({}, initialSoundPack);
  let currentVolume = loadVolume();
  let currentEnabled = loadEnabled();
  function loadVolume() {
    if (initialVolume !== void 0) return Math.max(0, Math.min(1, initialVolume));
    const stored = localStorage2?.getItem(audioVolumeKey);
    if (stored !== null && stored !== void 0) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed)) return Math.max(0, Math.min(1, parsed));
    }
    return 0.5;
  }
  function loadEnabled() {
    if (initialEnabled !== void 0) return initialEnabled;
    const stored = localStorage2?.getItem(audioEnabledKey);
    if (stored !== null) return stored === 'true';
    return false;
  }
  function createAudioElement(source) {
    if (typeof source === 'string') {
      try {
        const AudioCtor = windowRef?.Audio || (typeof Audio !== 'undefined' ? Audio : null);
        if (!AudioCtor) return null;
        const audio = new AudioCtor(source);
        audio.volume = currentVolume;
        audio.preload = 'auto';
        return audio;
      } catch (error) {
        console.warn(`Failed to create audio element from URL: ${source}`, error);
        return null;
      }
    } else {
      try {
        const audio = source.cloneNode(true);
        audio.volume = currentVolume;
        return audio;
      } catch (error) {
        console.warn('Failed to clone audio element', error);
        return null;
      }
    }
  }
  function initializePool(type) {
    const source = currentSoundPack[type];
    if (!source) return;
    const elements = [];
    for (let i = 0; i < poolSize; i++) {
      const audio = createAudioElement(source);
      if (audio) {
        elements.push(audio);
      }
    }
    if (elements.length > 0) {
      audioPools.set(type, {
        elements,
        currentIndex: 0
      });
    }
  }
  function initializeAllPools() {
    const types = ['keyPress', 'correct', 'error', 'complete'];
    types.forEach((type) => {
      if (currentSoundPack[type]) {
        initializePool(type);
      }
    });
  }
  function playSound(type) {
    if (!currentEnabled) return;
    const pool = audioPools.get(type);
    if (!pool || pool.elements.length === 0) return;
    const audio = pool.elements[pool.currentIndex];
    if (!audio) return;
    pool.currentIndex = (pool.currentIndex + 1) % pool.elements.length;
    try {
      audio.currentTime = 0;
      audio.volume = currentVolume;
      const playPromise = audio.play();
      if (playPromise !== void 0) {
        playPromise.catch((error) => {
          if (error.name !== 'NotAllowedError') {
            console.warn(`Failed to play sound: ${type}`, error);
          }
        });
      }
    } catch (error) {
      console.warn(`Error playing sound: ${type}`, error);
    }
  }
  function setVolume(volume) {
    currentVolume = Math.max(0, Math.min(1, volume));
    localStorage2?.setItem(audioVolumeKey, String(currentVolume));
    audioPools.forEach((pool) => {
      pool.elements.forEach((audio) => {
        audio.volume = currentVolume;
      });
    });
  }
  function getVolume() {
    return currentVolume;
  }
  function enable() {
    currentEnabled = true;
    localStorage2?.setItem(audioEnabledKey, 'true');
  }
  function disable() {
    currentEnabled = false;
    localStorage2?.setItem(audioEnabledKey, 'false');
  }
  function toggle() {
    if (currentEnabled) {
      disable();
    } else {
      enable();
    }
    return currentEnabled;
  }
  function isEnabled() {
    return currentEnabled;
  }
  function updateSoundPack(soundPack) {
    currentSoundPack = __spreadValues({}, soundPack);
    audioPools.forEach((pool) => {
      pool.elements.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
    });
    audioPools.clear();
    initializeAllPools();
  }
  function preloadSounds() {
    return __async(this, null, function* () {
      const promises = [];
      audioPools.forEach((pool) => {
        pool.elements.forEach((audio) => {
          const promise = new Promise((resolve) => {
            if (audio.readyState >= 2) {
              resolve();
            } else {
              audio.addEventListener('canplaythrough', () => resolve(), {
                once: true
              });
              audio.addEventListener('error', () => resolve(), {
                once: true
              });
              audio.load();
            }
          });
          promises.push(promise);
        });
      });
      try {
        yield Promise.all(promises);
      } catch (error) {
        console.warn('Some audio files failed to preload', error);
      }
    });
  }
  function destroy() {
    audioPools.forEach((pool) => {
      pool.elements.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
    });
    audioPools.clear();
  }
  initializeAllPools();
  return {
    playSound,
    setVolume,
    getVolume,
    enable,
    disable,
    toggle,
    isEnabled,
    updateSoundPack,
    preloadSounds,
    destroy
  };
}

// ../../packages/pitype-core/dist/player.js
function createPlayer(options) {
  const {
    recording,
    playbackSpeed: initialSpeed = 1,
    onEvent,
    onComplete,
    onProgress,
    progressInterval = 100
  } = options;
  let state = 'idle';
  let currentSpeed = initialSpeed;
  let currentEventIndex = 0;
  let currentTime = 0;
  let startPlayTime = 0;
  let pausedTime = 0;
  let eventTimer = null;
  let progressTimer = null;
  const events = recording.events;
  const duration =
    events.length > 0 ? events[events.length - 1].timestamp - events[0].timestamp : 0;
  function clearTimers() {
    if (eventTimer !== null) {
      clearTimeout(eventTimer);
      eventTimer = null;
    }
    if (progressTimer !== null) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  }
  function startProgressTimer() {
    if (progressTimer !== null || !onProgress) return;
    progressTimer = setInterval(() => {
      if (state === 'playing') {
        onProgress(currentTime, duration);
      }
    }, progressInterval);
  }
  function stopProgressTimer() {
    if (progressTimer !== null) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  }
  function scheduleNextEvent() {
    if (currentEventIndex >= events.length) {
      complete();
      return;
    }
    const currentEvent = events[currentEventIndex];
    const nextEvent = events[currentEventIndex + 1];
    if (onEvent) {
      onEvent(currentEvent, currentTime);
    }
    currentEventIndex++;
    if (!nextEvent) {
      complete();
      return;
    }
    const delay = (nextEvent.timestamp - currentEvent.timestamp) / currentSpeed;
    eventTimer = setTimeout(() => {
      if (state === 'playing') {
        currentTime = nextEvent.timestamp - events[0].timestamp;
        scheduleNextEvent();
      }
    }, delay);
  }
  function play() {
    if (state === 'playing') return;
    if (state === 'completed') {
      stop();
    }
    state = 'playing';
    startPlayTime = Date.now() - pausedTime;
    if (events.length === 0) {
      complete();
      return;
    }
    if (currentEventIndex === 0 && events.length > 0) {
      const firstEvent = events[0];
      if (onEvent) {
        onEvent(firstEvent, 0);
      }
      currentEventIndex++;
      currentTime = 0;
    }
    startProgressTimer();
    scheduleNextEvent();
  }
  function pause() {
    if (state !== 'playing') return;
    state = 'paused';
    pausedTime = Date.now() - startPlayTime;
    clearTimers();
    stopProgressTimer();
  }
  function resume() {
    if (state !== 'paused') return;
    play();
  }
  function stop() {
    clearTimers();
    stopProgressTimer();
    state = 'idle';
    currentEventIndex = 0;
    currentTime = 0;
    pausedTime = 0;
    startPlayTime = 0;
  }
  function complete() {
    clearTimers();
    stopProgressTimer();
    state = 'completed';
    currentTime = duration;
    if (onProgress) {
      onProgress(duration, duration);
    }
    if (onComplete) {
      onComplete();
    }
  }
  function seek(timestamp) {
    const wasPlaying = state === 'playing';
    if (wasPlaying) {
      pause();
    }
    const clampedTime = Math.max(0, Math.min(timestamp, duration));
    currentTime = clampedTime;
    const absoluteTime = events[0].timestamp + clampedTime;
    let newIndex = 0;
    for (let i = 0; i < events.length; i++) {
      if (events[i].timestamp <= absoluteTime) {
        newIndex = i;
      } else {
        break;
      }
    }
    currentEventIndex = newIndex;
    if (onEvent && currentEventIndex < events.length) {
      onEvent(events[currentEventIndex], currentTime);
    }
    if (wasPlaying) {
      resume();
    }
  }
  function setSpeed(speed) {
    const wasPlaying = state === 'playing';
    if (wasPlaying) {
      pause();
    }
    currentSpeed = Math.max(0.1, Math.min(10, speed));
    if (wasPlaying) {
      resume();
    }
  }
  function getSpeed() {
    return currentSpeed;
  }
  function getCurrentTime() {
    return currentTime;
  }
  function getDuration() {
    return duration;
  }
  function getState() {
    return state;
  }
  function isPlaying() {
    return state === 'playing';
  }
  function destroy() {
    clearTimers();
    stopProgressTimer();
    state = 'idle';
  }
  return {
    play,
    pause,
    resume,
    stop,
    seek,
    setSpeed,
    getSpeed,
    getCurrentTime,
    getDuration,
    getState,
    isPlaying,
    destroy
  };
}
function getRecordingStats(recording) {
  const events = recording.events;
  const duration =
    events.length > 0 ? events[events.length - 1].timestamp - events[0].timestamp : 0;
  const inputCount = events.filter((e) => e.type === 'input:evaluate').length;
  const undoCount = events.filter((e) => e.type === 'input:undo').length;
  const characterCount = recording.textSource.content.length;
  return {
    duration,
    eventCount: events.length,
    inputCount,
    undoCount,
    characterCount
  };
}

// ../../packages/pitype-core/dist/ghostManager.js
var ghostIdCounter = 0;
function createGhostManager(options) {
  const {
    textDisplay,
    textContainer,
    getSpans,
    autoRemoveOnComplete = false,
    onGhostComplete
  } = options;
  const ghosts = /* @__PURE__ */ new Map();
  function generateGhostId() {
    return `ghost-${++ghostIdCounter}-${Date.now()}`;
  }
  function createGhostCursorElement(config) {
    const cursorElement = document.createElement('div');
    cursorElement.classList.add('cursor', 'ghost-cursor');
    cursorElement.setAttribute('data-ghost-name', config.name);
    const opacity = config.opacity !== void 0 ? config.opacity : 0.6;
    cursorElement.style.opacity = String(opacity);
    cursorElement.style.zIndex = '1';
    textDisplay.appendChild(cursorElement);
    return cursorElement;
  }
  function createGhostLabelElement(config) {
    if (!config.showLabel) return void 0;
    const labelElement = document.createElement('div');
    labelElement.classList.add('ghost-label');
    labelElement.textContent = config.name;
    labelElement.style.position = 'absolute';
    labelElement.style.fontSize = '12px';
    labelElement.style.padding = '2px 6px';
    labelElement.style.borderRadius = '3px';
    labelElement.style.backgroundColor = config.color || 'rgba(255, 255, 255, 0.8)';
    labelElement.style.color = '#000';
    labelElement.style.pointerEvents = 'none';
    labelElement.style.whiteSpace = 'nowrap';
    labelElement.style.transform = 'translateY(-20px)';
    labelElement.style.zIndex = '3';
    textDisplay.appendChild(labelElement);
    return labelElement;
  }
  function updateLabelPosition(ghost) {
    if (!ghost.labelElement) return;
    const cursorRect = ghost.cursorElement.getBoundingClientRect();
    const textRect = textDisplay.getBoundingClientRect();
    const left = cursorRect.left - textRect.left + (textDisplay.scrollLeft ?? 0);
    const top = cursorRect.top - textRect.top + (textDisplay.scrollTop ?? 0);
    ghost.labelElement.style.left = `${left}px`;
    ghost.labelElement.style.top = `${top}px`;
  }
  function addGhost(config) {
    const ghostId = generateGhostId();
    const dummyInput = document.createElement('input');
    dummyInput.style.display = 'none';
    const cursorElement = createGhostCursorElement(config);
    const labelElement = createGhostLabelElement(config);
    let currentPosition = 0;
    const cursorAdapter = createDomCursorAdapter({
      textDisplay,
      textContainer,
      getCurrentPosition: () => currentPosition,
      getCursor: () => cursorElement,
      getInput: () => dummyInput,
      getSpans,
      cursorShape: config.shape || 'line',
      cursorColor: config.color || 'rgba(255, 215, 0, 0.8)',
      cursorBlinkEnabled: false
      // 幽灵光标不闪烁
    });
    const player = createPlayer({
      recording: config.recording,
      onEvent: (event) => {
        if (event.type === 'input:evaluate') {
          currentPosition = event.index + 1;
          cursorAdapter.updatePosition({
            immediate: false
          });
          if (labelElement) {
            requestAnimationFrame(() => {
              const ghost2 = ghosts.get(ghostId);
              if (ghost2) updateLabelPosition(ghost2);
            });
          }
        } else if (event.type === 'input:undo') {
          currentPosition = event.index;
          cursorAdapter.updatePosition({
            immediate: false
          });
          if (labelElement) {
            requestAnimationFrame(() => {
              const ghost2 = ghosts.get(ghostId);
              if (ghost2) updateLabelPosition(ghost2);
            });
          }
        }
      },
      onComplete: () => {
        onGhostComplete?.(ghostId);
        if (autoRemoveOnComplete) {
          removeGhost(ghostId);
        }
      }
    });
    cursorAdapter.cacheCharSpans();
    cursorAdapter.updatePosition({
      immediate: true
    });
    if (labelElement) {
      updateLabelPosition({
        id: ghostId,
        config,
        player,
        cursorAdapter,
        cursorElement,
        labelElement,
        currentPosition
      });
    }
    const ghost = {
      id: ghostId,
      config,
      player,
      cursorAdapter,
      cursorElement,
      labelElement,
      currentPosition
    };
    ghosts.set(ghostId, ghost);
    return ghostId;
  }
  function removeGhost(ghostId) {
    const ghost = ghosts.get(ghostId);
    if (!ghost) return;
    ghost.player.destroy();
    ghost.cursorElement.remove();
    ghost.labelElement?.remove();
    ghosts.delete(ghostId);
  }
  function getGhost(ghostId) {
    return ghosts.get(ghostId);
  }
  function getAllGhosts() {
    return Array.from(ghosts.values());
  }
  function startAll() {
    ghosts.forEach((ghost) => {
      ghost.player.play();
    });
  }
  function pauseAll() {
    ghosts.forEach((ghost) => {
      ghost.player.pause();
    });
  }
  function resumeAll() {
    ghosts.forEach((ghost) => {
      ghost.player.resume();
    });
  }
  function stopAll() {
    ghosts.forEach((ghost) => {
      ghost.player.stop();
    });
  }
  function setSpeedAll(speed) {
    ghosts.forEach((ghost) => {
      ghost.player.setSpeed(speed);
    });
  }
  function destroy() {
    ghosts.forEach((ghost) => {
      ghost.player.destroy();
      ghost.cursorElement.remove();
      ghost.labelElement?.remove();
    });
    ghosts.clear();
  }
  return {
    addGhost,
    removeGhost,
    getGhost,
    getAllGhosts,
    startAll,
    pauseAll,
    resumeAll,
    stopAll,
    setSpeedAll,
    destroy
  };
}

// ../../packages/pitype-core/dist/locale.js
var localeRegistry = /* @__PURE__ */ new Map();
function registerLocale(locale) {
  localeRegistry.set(locale.code, locale);
}
function getLocale(code) {
  return localeRegistry.get(code);
}
function getLocaleString(code, key) {
  const visited = /* @__PURE__ */ new Set();
  let currentCode = code;
  while (currentCode) {
    if (visited.has(currentCode)) break;
    visited.add(currentCode);
    const locale = localeRegistry.get(currentCode);
    if (!locale) break;
    if (locale.strings[key] !== void 0) {
      return locale.strings[key];
    }
    currentCode = locale.fallbackCode;
  }
  return void 0;
}
export {
  TypingSession,
  createDomAudioController,
  createDomCursorAdapter,
  createDomInputController,
  createDomStatsPanel,
  createDomTextRenderer,
  createDomThemeController,
  createGhostManager,
  createPlayer,
  createRecorder,
  createSessionRuntime,
  createStatsTracker,
  createTextSource,
  deserializeRecording,
  exportRecordingToFile,
  getLocale,
  getLocaleString,
  getRecordingStats,
  importRecordingFromFile,
  registerLocale,
  serializeRecording,
  tokenizeText
};
//# sourceMappingURL=pitype-core.js.map
