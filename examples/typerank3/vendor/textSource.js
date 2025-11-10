import { tokenizeText } from './tokenizer.js';
let sourceCounter = 0;
export function createTextSource(content, options = {}) {
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
