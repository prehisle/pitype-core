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
const mobileUserAgentPattern =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

const reduceMotionQuery =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

export function createCursorAdapter({
  textDisplay,
  textContainer,
  getCurrentPosition,
  getCursor,
  getInput,
  getSpans = () => [],
  setSpans = () => {}
}) {
  let cursorUpdateScheduled = false;
  let cursorAnimationFrameId = null;
  let currentCursorMetrics = null;
  let lastCursorY = 0;
  let resizeObserver = null;
  let resizeRefreshRaf = null;
  let hasWindowResizeHandler = false;
  let mobileSupportAttached = false;

  function cacheCharSpans() {
    if (!textDisplay) {
      setSpans([]);
      return [];
    }

    const wordSpans = textDisplay.querySelectorAll('.word');
    const measured = [];

    wordSpans.forEach((wordSpan) => {
      const children = wordSpan.children;

      for (let i = 0; i < children.length; i++) {
        const span = children[i];
        if (span.classList.contains('line-break')) {
          measured.push({
            element: span,
            rect: span.getBoundingClientRect(),
            dataChar: '\n'
          });
          continue;
        }

        if (span.classList.contains('word-space') || span.classList.contains('no-break')) {
          measured.push({
            element: span,
            rect: span.getBoundingClientRect(),
            dataChar: span.getAttribute('data-char') || ' '
          });
        } else if (span.getAttribute('data-char')) {
          measured.push({
            element: span,
            rect: span.getBoundingClientRect(),
            dataChar: span.getAttribute('data-char')
          });
        } else {
          const innerSpans = span.querySelectorAll('[data-char]');
          innerSpans.forEach((innerSpan) => {
            if (
              !innerSpan.parentElement.classList.contains('word-space') &&
              !innerSpan.parentElement.classList.contains('no-break')
            ) {
              measured.push({
                element: innerSpan,
                rect: innerSpan.getBoundingClientRect(),
                dataChar: innerSpan.getAttribute('data-char')
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
    requestAnimationFrame(() => {
      cursorUpdateScheduled = false;
      updatePosition();
    });
  }

  function updatePosition(options = { immediate: false }) {
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
      { immediate: options.immediate },
      cursor,
      input
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

  function resetAnimation() {
    if (cursorAnimationFrameId) {
      cancelAnimationFrame(cursorAnimationFrameId);
      cursorAnimationFrameId = null;
    }
    currentCursorMetrics = null;
  }

  function scheduleLayoutRefresh() {
    if (resizeRefreshRaf) return;
    resizeRefreshRaf = requestAnimationFrame(() => {
      resizeRefreshRaf = null;
      cacheCharSpans();
      lastCursorY = 0;
      updatePosition({ immediate: true });
    });
  }

  function enableResponsiveSync() {
    if (hasWindowResizeHandler) return;
    if (!textContainer) return;

    window.addEventListener('resize', scheduleLayoutRefresh);
    hasWindowResizeHandler = true;

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

  function enableMobileSupport() {
    if (mobileSupportAttached) return;
    if (!textDisplay) return;

    if (mobileUserAgentPattern.test(navigator.userAgent)) {
      textDisplay.addEventListener('click', () => {
        const input = getInput();
        if (input) {
          input.focus();
        }
      });
    }

    mobileSupportAttached = true;
  }

  function applyCursorMetrics(metrics, cursor, input) {
    if (!cursor || !input) return;
    const snapshot = {
      left: metrics.left,
      top: metrics.top,
      width: metrics.width,
      height: metrics.height
    };

    cursor.style.width = `${snapshot.width}px`;
    cursor.style.height = `${snapshot.height}px`;
    cursor.style.transform = `translate3d(${snapshot.left}px, ${snapshot.top}px, 0)`;

    const inputWidth = Math.max(
      snapshot.width * cursorMinimums.widthMultiplier,
      cursorMinimums.inputWidth
    );
    input.style.width = `${inputWidth}px`;
    input.style.height = `${snapshot.height}px`;
    input.style.transform = `translate3d(${snapshot.left}px, ${snapshot.top}px, 0)`;

    currentCursorMetrics = snapshot;
  }

  function animateCursorTo(targetMetrics, options, cursor, input) {
    if (!cursor || !input) return;

    const duration = getCursorAnimationDuration();
    const skipAnimation =
      options.immediate || shouldReduceMotion() || duration === 0 || !currentCursorMetrics;

    if (cursorAnimationFrameId) {
      cancelAnimationFrame(cursorAnimationFrameId);
      cursorAnimationFrameId = null;
    }

    if (skipAnimation) {
      applyCursorMetrics(targetMetrics, cursor, input);
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

      applyCursorMetrics(nextState, cursor, input);

      if (progress < 1) {
        cursorAnimationFrameId = requestAnimationFrame(tick);
      } else {
        cursorAnimationFrameId = null;
        applyCursorMetrics(target, cursor, input);
      }
    };

    cursorAnimationFrameId = requestAnimationFrame(tick);
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

  return {
    cacheCharSpans,
    updatePosition,
    resetAnimation,
    scheduleRefresh,
    scheduleLayoutRefresh,
    enableResponsiveSync,
    enableMobileSupport
  };
}

function lerp(from, to, progress) {
  return from + (to - from) * progress;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

