import { tokenizeText, Token } from './tokenizer';

export interface TextSource {
  id: string;
  content: string;
  locale?: string;
  tokens: Token[];
}

export interface CreateTextSourceOptions {
  id?: string;
  locale?: string;
  tokens?: Token[];
}

let sourceCounter = 0;

export function createTextSource(
  content: string,
  options: CreateTextSourceOptions = {}
): TextSource {
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
