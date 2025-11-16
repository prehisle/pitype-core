import type { TextSource } from '../textSource.js';
import type { TextToken } from '../tokenizer.js';

export interface DomTextRenderer {
  render(source: TextSource | null | undefined): void;
  setSpans(spans: HTMLElement[]): void;
  getSpans(): HTMLElement[];
  applySpanState(index: number, correct: boolean): void;
  resetSpanState(index: number): void;
}

export interface DomTextRendererOptions {
  documentRef?: Document;
  preserveChildren?: boolean;
  textContentClass?: string;
  lineBreakOptions?: LineBreakOptions;
}

export interface LineBreakDecision {
  attachToPrevious?: boolean;
  attachToNext?: boolean;
}

export interface LineBreakContext {
  token: TextToken;
  index: number;
  tokens: TextToken[];
  previousToken?: TextToken;
  nextToken?: TextToken;
}

export type LineBreakMatcher = (context: LineBreakContext) => LineBreakDecision | void;

export interface LineBreakOptions {
  disableDefaultCjk?: boolean;
  attachToPreviousChars?: string[];
  attachToNextChars?: string[];
  matchers?: LineBreakMatcher[];
}

const DEFAULT_ATTACH_TO_PREVIOUS = new Set([
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

const DEFAULT_ATTACH_TO_NEXT = new Set(['（', '【', '《', '『', '「', '“', '‘']);

export function createDomTextRenderer(
  textDisplay: HTMLElement,
  options: DomTextRendererOptions = {}
): DomTextRenderer {
  const doc = options.documentRef ?? (typeof document !== 'undefined' ? document : undefined);
  const preserveChildren = options.preserveChildren ?? false;
  const textContentClass = options.textContentClass ?? 'pitype-text-content';
  const normalizedLineBreakOptions = normalizeLineBreakOptions(options.lineBreakOptions);
  const shouldApplyLineBreakRules = hasLineBreakRules(normalizedLineBreakOptions);
  let charSpans: HTMLElement[] = [];

  const render = (source: TextSource | null | undefined) => {
    if (!textDisplay || !source || !doc) return;
    const tokens = source.tokens ?? [];
    const fragment = doc.createDocumentFragment();
    let currentWord: HTMLElement | null = null;
    const lineBreakDecisions = shouldApplyLineBreakRules
      ? computeLineBreakDecisions(tokens, normalizedLineBreakOptions)
      : [];

    const flushWord = () => {
      if (currentWord) {
        fragment.appendChild(currentWord);
        currentWord = null;
      }
    };

    const ensureWord = (language?: string) => {
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

    let previousRenderableSpan: HTMLElement | null = null;
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

      let currentDecision: LineBreakDecision | undefined;
      let nextDecision: LineBreakDecision | undefined;

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

  const setSpans = (spans: HTMLElement[] = []) => {
    charSpans = Array.isArray(spans) ? spans : [];
  };

  const getSpans = () => charSpans;

  const getSpanByIndex = (index: number) => {
    if (index == null || index < 0 || index >= charSpans.length) return null;
    return charSpans[index];
  };

  const applySpanState = (index: number, correct: boolean) => {
    const span = getSpanByIndex(index);
    if (!span) return;
    span.classList.remove('correct', 'incorrect');
    span.classList.add(correct ? 'correct' : 'incorrect');
  };

  const resetSpanState = (index: number) => {
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

function createTokenSpan(token: TextToken, doc: Document): HTMLElement {
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

function computeLineBreakDecisions(
  tokens: TextToken[],
  options: NormalizedLineBreakOptions
): Array<LineBreakDecision | undefined> {
  const decisions: Array<LineBreakDecision | undefined> = new Array(tokens.length);
  let previousRenderableToken: TextToken | undefined;

  tokens.forEach((token, index) => {
    if (token.type === 'newline') {
      decisions[index] = undefined;
      previousRenderableToken = undefined;
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

interface NormalizedLineBreakOptions {
  attachToPreviousChars: Set<string>;
  attachToNextChars: Set<string>;
  matchers: LineBreakMatcher[];
}

function normalizeLineBreakOptions(options?: LineBreakOptions): NormalizedLineBreakOptions {
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

function hasLineBreakRules(options: NormalizedLineBreakOptions): boolean {
  return (
    options.attachToPreviousChars.size > 0 ||
    options.attachToNextChars.size > 0 ||
    options.matchers.length > 0
  );
}

function evaluateLineBreakDecision(
  context: LineBreakContext,
  options: NormalizedLineBreakOptions
): LineBreakDecision | undefined {
  let decision: LineBreakDecision | undefined;

  if (options.attachToPreviousChars.has(context.token.char)) {
    decision = { ...(decision ?? {}), attachToPrevious: true };
  }

  if (options.attachToNextChars.has(context.token.char)) {
    decision = { ...(decision ?? {}), attachToNext: true };
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

function applyNoBreak(previousSpan: HTMLElement, currentSpan: HTMLElement): void {
  previousSpan.classList.add('no-break');
  currentSpan.classList.add('no-break');
}
