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
const mobileUserAgentPattern = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
export function createDomCursorAdapter(options) {
    const { textDisplay, textContainer, getCurrentPosition, getCursor, getInput, getSpans = () => [], setSpans = () => { }, windowRef, documentRef = typeof document !== 'undefined' ? document : undefined, navigatorRef = typeof navigator !== 'undefined' ? navigator : undefined, requestAnimationFrame: requestAnimationFrameImpl = (cb) => windowRef?.requestAnimationFrame ? windowRef.requestAnimationFrame(cb) : (cb(Date.now()), 0), cancelAnimationFrame: cancelAnimationFrameImpl = (handle) => windowRef?.cancelAnimationFrame?.(handle), performanceNow = () => windowRef?.performance?.now?.() ?? Date.now(), localStorage = windowRef?.localStorage, resizeObserverCtor = typeof ResizeObserver !== 'undefined' ? ResizeObserver : undefined } = options;
    let cursorUpdateScheduled = false;
    let cursorAnimationFrameId = null;
    let currentCursorMetrics = null;
    let lastCursorY = 0;
    let resizeObserver = null;
    let resizeRefreshRaf = null;
    let hasWindowResizeHandler = false;
    let mobileSupportAttached = false;
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
                }
                else if (span.getAttribute?.('data-char')) {
                    measured.push({
                        element: span,
                        rect: span.getBoundingClientRect(),
                        dataChar: span.getAttribute('data-char')
                    });
                }
                else {
                    const innerSpans = span.querySelectorAll?.('[data-char]') ?? [];
                    innerSpans.forEach((innerSpan) => {
                        const htmlSpan = innerSpan;
                        if (!htmlSpan.parentElement?.classList?.contains('word-space') &&
                            !htmlSpan.parentElement?.classList?.contains('no-break')) {
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
        if (cursorUpdateScheduled)
            return;
        cursorUpdateScheduled = true;
        requestAnimationFrameImpl((timestamp) => {
            cursorUpdateScheduled = false;
            updatePosition({ immediate: true });
        });
    }
    function updatePosition(options = { immediate: false }) {
        const cursor = getCursor();
        const input = getInput();
        if (!cursor || !input || !textDisplay)
            return;
        let spans = getSpans();
        if (!spans || spans.length === 0) {
            spans = cacheCharSpans();
        }
        const position = getCurrentPosition();
        if (position < 0 || position >= spans.length)
            return;
        const currentChar = spans[position];
        if (!currentChar)
            return;
        const textRect = textDisplay.getBoundingClientRect();
        const charRect = currentChar.getBoundingClientRect();
        const top = charRect.top - textRect.top + (textDisplay.scrollTop ?? 0);
        const left = charRect.left - textRect.left + (textDisplay.scrollLeft ?? 0);
        const width = Math.max(charRect.width, cursorMinimums.width);
        const height = Math.max(charRect.height, cursorMinimums.height);
        animateCursorTo({
            left,
            top,
            width,
            height
        }, { immediate: options.immediate ?? false }, cursor, input);
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
        }
        else if (lastCursorY === 0) {
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
        if (resizeRefreshRaf !== null)
            return;
        resizeRefreshRaf = requestAnimationFrameImpl(() => {
            resizeRefreshRaf = null;
            cacheCharSpans();
            lastCursorY = 0;
            updatePosition({ immediate: true });
        });
    }
    function enableResponsiveSync() {
        if (hasWindowResizeHandler || !textContainer || !windowRef)
            return;
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
        if (mobileSupportAttached || !textDisplay)
            return;
        if (navigatorRef && mobileUserAgentPattern.test(navigatorRef.userAgent ?? '')) {
            textDisplay.addEventListener?.('click', () => {
                const input = getInput();
                input?.focus?.();
            });
        }
        mobileSupportAttached = true;
    }
    function applyCursorMetrics(metrics, cursor, input) {
        cursor.style.width = `${metrics.width}px`;
        cursor.style.height = `${metrics.height}px`;
        cursor.style.transform = `translate3d(${metrics.left}px, ${metrics.top}px, 0)`;
        const inputWidth = Math.max(metrics.width * cursorMinimums.widthMultiplier, cursorMinimums.inputWidth);
        input.style.width = `${inputWidth}px`;
        input.style.height = `${metrics.height}px`;
        input.style.transform = `translate3d(${metrics.left}px, ${metrics.top}px, 0)`;
        currentCursorMetrics = { ...metrics };
    }
    function animateCursorTo(targetMetrics, options, cursor, input) {
        const duration = getCursorAnimationDuration();
        const skipAnimation = options.immediate || shouldReduceMotion() || duration === 0 || !currentCursorMetrics;
        if (cursorAnimationFrameId !== null) {
            cancelAnimationFrameImpl?.(cursorAnimationFrameId);
            cursorAnimationFrameId = null;
        }
        if (skipAnimation) {
            applyCursorMetrics(targetMetrics, cursor, input);
            return;
        }
        const from = { ...currentCursorMetrics };
        const target = { ...targetMetrics };
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
            }
            else {
                cursorAnimationFrameId = null;
                applyCursorMetrics(target, cursor, input);
            }
        };
        cursorAnimationFrameId = requestAnimationFrameImpl(tick);
    }
    function getCursorAnimationDuration() {
        const stored = localStorage?.getItem(cursorAnimationPreferenceKey);
        if (stored && stored in cursorAnimationDurations) {
            return cursorAnimationDurations[stored];
        }
        return cursorAnimationDurations.fast;
    }
    function shouldReduceMotion() {
        const reduceMotionQuery = windowRef?.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;
        return !!reduceMotionQuery?.matches;
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
