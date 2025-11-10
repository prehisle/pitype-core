import { type TextSource, type TextToken } from '@pitype/core';

export interface TextRenderer {
  render(source: TextSource): void;
  setSpans(spans: HTMLElement[]): void;
  getSpans(): HTMLElement[];
  applySpanState(index: number, correct: boolean): void;
  resetSpanState(index: number): void;
}

export function createTextRenderer(textDisplay: HTMLElement): TextRenderer {
  let charSpans: HTMLElement[] = [];

  const render = (source: TextSource): void => {
    if (!textDisplay || !source) return;

    const tokens = source.tokens || [];
    const fragment = document.createDocumentFragment();
    let currentWord: HTMLSpanElement | null = null;

    const flushWord = (): void => {
      if (currentWord) {
        fragment.appendChild(currentWord);
        currentWord = null;
      }
    };

    const ensureWord = (language: string): HTMLSpanElement => {
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

      const word =
        token.attachToPrevious && currentWord
          ? currentWord
          : ensureWord(token.language);

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
    charSpans = [];
  };

  const setSpans = (spans: HTMLElement[] = []): void => {
    charSpans = Array.isArray(spans) ? spans : [];
  };

  const getSpans = (): HTMLElement[] => charSpans;

  const getSpanByIndex = (index: number): HTMLElement | null => {
    if (index == null) return null;
    if (index < 0 || index >= charSpans.length) return null;
    return charSpans[index];
  };

  const applySpanState = (index: number, correct: boolean): void => {
    const span = getSpanByIndex(index);
    if (!span) return;
    span.classList.remove('correct', 'incorrect');
    span.classList.add(correct ? 'correct' : 'incorrect');
  };

  const resetSpanState = (index: number): void => {
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

function createTokenSpan(token: TextToken): HTMLSpanElement {
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
