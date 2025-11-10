import { tokenizeText, type TextToken } from './tokenizer.js';

let sourceCounter = 0;

export interface TextSource {
  id: string;
  content: string;
  locale?: string;
  tokens: TextToken[];
}

export interface TextSourceOptions {
  id?: string;
  locale?: string;
  tokens?: TextToken[];
}

export function createTextSource(content: string, options: TextSourceOptions = {}): TextSource {
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
