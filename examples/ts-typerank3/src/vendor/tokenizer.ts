const ENGLISH_RE = /[A-Za-z0-9]/;
const CHINESE_RE = /[\u3400-\u9FBF]/;
const FULL_WIDTH_SPACE = '\u3000';

const PUNCTUATION_SET = new Set([
  ',', '.', '!', '?', ';', ':', '"', "'", '-', '_',
  '(', ')', '[', ']', '{', '}',
  '，', '。', '！', '？', '：', '；',
  '「', '」', '『', '』', '（', '）', '、', '—', '…', '·',
  '《', '》', '：', '！', '？'
]);

export type TokenType = 'char' | 'space' | 'punctuation' | 'newline';
export type TokenLanguage = 'chinese' | 'english' | 'separator' | 'other';

export interface Token {
  char: string;
  type: TokenType;
  language: TokenLanguage;
  attachToPrevious: boolean;
}

export function tokenizeText(text: string): Token[] {
  const tokens: Token[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '\r') {
      continue; // 忽略 Windows 换行中的 \r
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

    const language: TokenLanguage = CHINESE_RE.test(char)
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
