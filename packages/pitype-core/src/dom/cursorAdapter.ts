type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const cursorAnimationPreferenceKey = 'cursorAnimationMode';
const cursorShapePreferenceKey = 'cursorShape';
const cursorColorPreferenceKey = 'cursorColor';
const cursorBlinkPreferenceKey = 'cursorBlinkEnabled';

const cursorAnimationDurations = {
  off: 0,
  slow: 150,
  medium: 115,
  fast: 85
} as const;

const cursorMinimums = {
  width: 2,
  height: 16,
  inputWidth: 30,
  widthMultiplier: 1.5
} as const;

export type CursorShape = 'block' | 'line' | 'underline' | 'outline';

const cursorShapeDefaults = {
  block: { widthMultiplier: 1, heightMultiplier: 1 },
  line: { widthMultiplier: 0.15, heightMultiplier: 1 },
  underline: { widthMultiplier: 1, heightMultiplier: 0.15 },
  outline: { widthMultiplier: 1, heightMultiplier: 1 }
} as const;

const mobileUserAgentPattern = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export interface DomCursorAdapterOptions {
  textDisplay: HTMLElement;
  textContainer?: HTMLElement | null;
  getCurrentPosition: () => number;
  getCursor: () => HTMLElement | null;
  getInput: () => (HTMLInputElement & { focus?: (options?: FocusOptions) => void }) | null;
  getSpans?: () => HTMLElement[];
  setSpans?: (spans: HTMLElement[]) => void;
  windowRef?: Window;
  documentRef?: Document;
  navigatorRef?: Navigator;
  requestAnimationFrame?: (callback: FrameRequestCallback) => number;
  cancelAnimationFrame?: (handle: number) => void;
  performanceNow?: () => number;
  localStorage?: StorageLike;
  resizeObserverCtor?: typeof ResizeObserver;

  // 光标外观配置
  cursorShape?: CursorShape;
  cursorColor?: string;
  cursorBlinkEnabled?: boolean;
  cursorBlinkRate?: number; // 毫秒，闪烁周期
}

export interface DomCursorAdapter {
  cacheCharSpans(): HTMLElement[];
  updatePosition(options?: { immediate?: boolean }): void;
  resetAnimation(): void;
  scheduleRefresh(): void;
  scheduleLayoutRefresh(): void;
  enableResponsiveSync(): void;
  enableMobileSupport(): void;

  // 光标外观配置方法
  setCursorShape(shape: CursorShape): void;
  setCursorColor(color: string): void;
  setCursorBlink(enabled: boolean): void;
  getCursorShape(): CursorShape;
  getCursorColor(): string | null;
  getCursorBlink(): boolean;
}

export function createDomCursorAdapter(options: DomCursorAdapterOptions): DomCursorAdapter {
  const {
    textDisplay,
    textContainer,
    getCurrentPosition,
    getCursor,
    getInput,
    getSpans = () => [],
    setSpans = () => {},
    windowRef = typeof window !== 'undefined' ? window : undefined,
    documentRef = typeof document !== 'undefined' ? document : undefined,
    navigatorRef = typeof navigator !== 'undefined' ? navigator : undefined,
    requestAnimationFrame: requestAnimationFrameImpl = (cb) =>
      windowRef?.requestAnimationFrame ? windowRef.requestAnimationFrame(cb) : (cb(Date.now()), 0),
    cancelAnimationFrame: cancelAnimationFrameImpl = (handle) =>
      windowRef?.cancelAnimationFrame?.(handle),
    performanceNow = () => windowRef?.performance?.now?.() ?? Date.now(),
    localStorage = windowRef?.localStorage,
    resizeObserverCtor = typeof ResizeObserver !== 'undefined' ? ResizeObserver : undefined,
    cursorShape: initialCursorShape,
    cursorColor: initialCursorColor,
    cursorBlinkEnabled: initialCursorBlinkEnabled,
    cursorBlinkRate = 530
  } = options;

  let cursorUpdateScheduled = false;
  let cursorAnimationFrameId: number | null = null;
  let currentCursorMetrics: CursorMetrics | null = null;
  let lastCursorY = 0;
  let resizeObserver: ResizeObserver | null = null;
  let resizeRefreshRaf: number | null = null;
  let hasWindowResizeHandler = false;
  let mobileSupportAttached = false;

  // 光标外观状态
  let currentCursorShape: CursorShape = loadCursorShape();
  let currentCursorColor: string | null = loadCursorColor();
  let currentCursorBlinkEnabled: boolean = loadCursorBlinkEnabled();

  // 从 localStorage 或初始配置加载光标形状
  function loadCursorShape(): CursorShape {
    if (initialCursorShape) return initialCursorShape;
    const stored = localStorage?.getItem(cursorShapePreferenceKey);
    if (
      stored &&
      (stored === 'block' || stored === 'line' || stored === 'underline' || stored === 'outline')
    ) {
      return stored as CursorShape;
    }
    return 'block';
  }

  // 从 localStorage 或初始配置加载光标颜色
  function loadCursorColor(): string | null {
    if (initialCursorColor) return initialCursorColor;
    return localStorage?.getItem(cursorColorPreferenceKey) || null;
  }

  // 从 localStorage 或初始配置加载闪烁设置
  function loadCursorBlinkEnabled(): boolean {
    if (initialCursorBlinkEnabled !== undefined) return initialCursorBlinkEnabled;
    const stored = localStorage?.getItem(cursorBlinkPreferenceKey);
    if (stored !== null) return stored === 'true';
    return false;
  }

  // 应用光标外观样式
  function applyCursorStyle(cursor: HTMLElement): void {
    // 移除所有形状类
    cursor.classList.remove('cursor-block', 'cursor-line', 'cursor-underline', 'cursor-outline');

    // 添加当前形状类
    cursor.classList.add(`cursor-${currentCursorShape}`);

    // 应用自定义颜色
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

    // 应用闪烁效果
    if (currentCursorBlinkEnabled) {
      cursor.style.animation = `cursor-blink ${cursorBlinkRate}ms step-end infinite`;
    } else {
      cursor.style.animation = '';
    }
  }

  function cacheCharSpans(): HTMLElement[] {
    if (!textDisplay || !documentRef) {
      setSpans([]);
      return [];
    }

    const wordSpans = textDisplay.querySelectorAll?.('.word') ?? [];
    const measured: Array<{ element: HTMLElement; rect: DOMRect; dataChar: string }> = [];

    wordSpans.forEach((wordSpan) => {
      const children = wordSpan.children ?? [];
      for (let i = 0; i < children.length; i++) {
        const span = children[i] as HTMLElement;
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
            dataChar: span.getAttribute('data-char') as string
          });
        } else {
          const innerSpans = span.querySelectorAll?.('[data-char]') ?? [];
          innerSpans.forEach((innerSpan) => {
            const htmlSpan = innerSpan as HTMLElement;
            if (
              !htmlSpan.parentElement?.classList?.contains('word-space') &&
              !htmlSpan.parentElement?.classList?.contains('no-break')
            ) {
              measured.push({
                element: htmlSpan,
                rect: htmlSpan.getBoundingClientRect(),
                dataChar: htmlSpan.getAttribute('data-char') as string
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

  function scheduleRefresh(): void {
    if (cursorUpdateScheduled) return;
    cursorUpdateScheduled = true;
    requestAnimationFrameImpl((timestamp) => {
      cursorUpdateScheduled = false;
      updatePosition({ immediate: false });
    });
  }

  function updatePosition(options: { immediate?: boolean } = { immediate: false }): void {
    const cursor = getCursor();
    const input = getInput();
    if (!cursor || !input || !textDisplay) return;

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
      { immediate: options.immediate ?? false },
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

  function resetAnimation(): void {
    if (cursorAnimationFrameId !== null) {
      cancelAnimationFrameImpl?.(cursorAnimationFrameId);
      cursorAnimationFrameId = null;
    }
    currentCursorMetrics = null;
  }

  function scheduleLayoutRefresh(): void {
    if (resizeRefreshRaf !== null) return;
    resizeRefreshRaf = requestAnimationFrameImpl(() => {
      resizeRefreshRaf = null;
      cacheCharSpans();
      lastCursorY = 0;
      updatePosition({ immediate: true });
    });
  }

  function enableResponsiveSync(): void {
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

  function enableMobileSupport(): void {
    if (mobileSupportAttached || !textDisplay) return;

    if (navigatorRef && mobileUserAgentPattern.test(navigatorRef.userAgent ?? '')) {
      textDisplay.addEventListener?.('click', () => {
        const input = getInput();
        input?.focus?.();
      });
    }

    mobileSupportAttached = true;
  }

  function applyCursorMetrics(
    metrics: CursorMetrics,
    cursor: HTMLElement,
    input: HTMLElement
  ): void {
    // 根据光标形状调整尺寸
    const shapeConfig = cursorShapeDefaults[currentCursorShape];
    const adjustedWidth = metrics.width * shapeConfig.widthMultiplier;
    const adjustedHeight = metrics.height * shapeConfig.heightMultiplier;

    // 对于 underline，调整垂直位置到字符底部
    let adjustedTop = metrics.top;
    if (currentCursorShape === 'underline') {
      adjustedTop = metrics.top + metrics.height - adjustedHeight;
    }

    cursor.style.width = `${adjustedWidth}px`;
    cursor.style.height = `${adjustedHeight}px`;
    cursor.style.transform = `translate3d(${metrics.left}px, ${adjustedTop}px, 0)`;

    // 应用光标外观样式（形状、颜色、闪烁）
    applyCursorStyle(cursor);

    const inputWidth = Math.max(
      metrics.width * cursorMinimums.widthMultiplier,
      cursorMinimums.inputWidth
    );
    input.style.width = `${inputWidth}px`;
    input.style.height = `${metrics.height}px`;
    input.style.transform = `translate3d(${metrics.left}px, ${metrics.top}px, 0)`;
    currentCursorMetrics = { ...metrics };
  }

  function animateCursorTo(
    targetMetrics: CursorMetrics,
    options: { immediate: boolean },
    cursor: HTMLElement,
    input: HTMLElement
  ): void {
    const duration = getCursorAnimationDuration();
    const skipAnimation =
      options.immediate || shouldReduceMotion() || duration === 0 || !currentCursorMetrics;

    if (cursorAnimationFrameId !== null) {
      cancelAnimationFrameImpl?.(cursorAnimationFrameId);
      cursorAnimationFrameId = null;
    }

    if (skipAnimation) {
      applyCursorMetrics(targetMetrics, cursor, input);
      return;
    }

    const from = { ...(currentCursorMetrics as CursorMetrics) };
    const target = { ...targetMetrics };
    const startTime = performanceNow();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);

      const nextState: CursorMetrics = {
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

  function getCursorAnimationDuration(): number {
    const stored = localStorage?.getItem(cursorAnimationPreferenceKey);
    if (stored && stored in cursorAnimationDurations) {
      return cursorAnimationDurations[stored as keyof typeof cursorAnimationDurations];
    }
    return cursorAnimationDurations.fast;
  }

  function shouldReduceMotion(): boolean {
    const reduceMotionQuery = windowRef?.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;
    return !!reduceMotionQuery?.matches;
  }

  // 光标外观配置方法
  function setCursorShape(shape: CursorShape): void {
    currentCursorShape = shape;
    localStorage?.setItem(cursorShapePreferenceKey, shape);
    const cursor = getCursor();
    if (cursor) {
      applyCursorStyle(cursor);
      updatePosition({ immediate: true });
    }
  }

  function setCursorColor(color: string): void {
    currentCursorColor = color;
    localStorage?.setItem(cursorColorPreferenceKey, color);
    const cursor = getCursor();
    if (cursor) applyCursorStyle(cursor);
  }

  function setCursorBlink(enabled: boolean): void {
    currentCursorBlinkEnabled = enabled;
    localStorage?.setItem(cursorBlinkPreferenceKey, String(enabled));
    const cursor = getCursor();
    if (cursor) applyCursorStyle(cursor);
  }

  function getCursorShape(): CursorShape {
    return currentCursorShape;
  }

  function getCursorColor(): string | null {
    return currentCursorColor;
  }

  function getCursorBlink(): boolean {
    return currentCursorBlinkEnabled;
  }

  return {
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

interface CursorMetrics {
  left: number;
  top: number;
  width: number;
  height: number;
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
