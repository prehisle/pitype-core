export function createDomTextRenderer(textDisplay, options = {}) {
    const doc = options.documentRef ?? (typeof document !== 'undefined' ? document : undefined);
    let charSpans = [];
    const render = (source) => {
        if (!textDisplay || !source || !doc)
            return;
        const tokens = source.tokens ?? [];
        const fragment = doc.createDocumentFragment();
        let currentWord = null;
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
        tokens.forEach((token) => {
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
                return;
            }
            const shouldReuseWord = token.type === 'char' &&
                token.language === 'english' &&
                currentWord &&
                currentWord.dataset.language === 'english';
            if (!shouldReuseWord && !(token.attachToPrevious && currentWord)) {
                flushWord();
            }
            const word = token.attachToPrevious && currentWord ? currentWord : ensureWord(token.language);
            const span = createTokenSpan(token, doc);
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
    const setSpans = (spans = []) => {
        charSpans = Array.isArray(spans) ? spans : [];
    };
    const getSpans = () => charSpans;
    const getSpanByIndex = (index) => {
        if (index == null || index < 0 || index >= charSpans.length)
            return null;
        return charSpans[index];
    };
    const applySpanState = (index, correct) => {
        const span = getSpanByIndex(index);
        if (!span)
            return;
        span.classList.remove('correct', 'incorrect');
        span.classList.add(correct ? 'correct' : 'incorrect');
    };
    const resetSpanState = (index) => {
        const span = getSpanByIndex(index);
        if (!span)
            return;
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
