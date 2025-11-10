import { describe, expect, it } from 'vitest';
import { tokenizeText, type TextToken } from '../src/tokenizer';

const normalizeChar = (char: string) => {
  if (char === '\n') return '\\n';
  if (char === '\r') return '\\r';
  if (char === '\t') return '\\t';
  return char;
};

const snapshot = (tokens: TextToken[]) =>
  tokens.map(token => ({
    char: normalizeChar(token.char),
    type: token.type,
    attachToPrevious: token.attachToPrevious ?? false,
    language: token.language
  }));

describe('tokenizeText', () => {
  it('splits英文单词并将空格/标点依附到前一个单词', () => {
    const tokens = tokenizeText('Hello world.');
    expect(snapshot(tokens)).toMatchInlineSnapshot(`
      [
        {
          "attachToPrevious": false,
          "char": "H",
          "language": "english",
          "type": "char",
        },
        {
          "attachToPrevious": false,
          "char": "e",
          "language": "english",
          "type": "char",
        },
        {
          "attachToPrevious": false,
          "char": "l",
          "language": "english",
          "type": "char",
        },
        {
          "attachToPrevious": false,
          "char": "l",
          "language": "english",
          "type": "char",
        },
        {
          "attachToPrevious": false,
          "char": "o",
          "language": "english",
          "type": "char",
        },
        {
          "attachToPrevious": true,
          "char": " ",
          "language": "separator",
          "type": "space",
        },
        {
          "attachToPrevious": false,
          "char": "w",
          "language": "english",
          "type": "char",
        },
        {
          "attachToPrevious": false,
          "char": "o",
          "language": "english",
          "type": "char",
        },
        {
          "attachToPrevious": false,
          "char": "r",
          "language": "english",
          "type": "char",
        },
        {
          "attachToPrevious": false,
          "char": "l",
          "language": "english",
          "type": "char",
        },
        {
          "attachToPrevious": false,
          "char": "d",
          "language": "english",
          "type": "char",
        },
        {
          "attachToPrevious": true,
          "char": ".",
          "language": "separator",
          "type": "punctuation",
        },
      ]
    `);
  });

  it('把中文字符逐个拆分，标点依附上一字符，支持换行 token', () => {
    const tokens = tokenizeText('打字练习。\n下一行');
    expect(snapshot(tokens)).toMatchInlineSnapshot(`
      [
        {
          "attachToPrevious": false,
          "char": "打",
          "language": "chinese",
          "type": "char",
        },
        {
          "attachToPrevious": false,
          "char": "字",
          "language": "chinese",
          "type": "char",
        },
        {
          "attachToPrevious": false,
          "char": "练",
          "language": "chinese",
          "type": "char",
        },
        {
          "attachToPrevious": false,
          "char": "习",
          "language": "chinese",
          "type": "char",
        },
        {
          "attachToPrevious": true,
          "char": "。",
          "language": "separator",
          "type": "punctuation",
        },
        {
          "attachToPrevious": false,
          "char": "\\n",
          "language": "separator",
          "type": "newline",
        },
        {
          "attachToPrevious": false,
          "char": "下",
          "language": "chinese",
          "type": "char",
        },
        {
          "attachToPrevious": false,
          "char": "一",
          "language": "chinese",
          "type": "char",
        },
        {
          "attachToPrevious": false,
          "char": "行",
          "language": "chinese",
          "type": "char",
        },
      ]
    `);
  });

  it('保留连续空格并各自绑定上一 token', () => {
    const tokens = tokenizeText('word  gap');
    const spaces = tokens.filter(t => t.type === 'space');
    expect(spaces).toHaveLength(2);
    expect(spaces.every(space => space.attachToPrevious)).toBe(true);
  });

  it('识别全角标点与混合文本', () => {
    const tokens = tokenizeText('中文：text（テキスト）！');
    const puncts = tokens.filter(t => t.type === 'punctuation');
    expect(puncts.map(p => p.char)).toContain('：');
    expect(puncts.map(p => p.char)).toContain('！');
  });

  it('保留 IME 输入常见的 `\\u3000` 全角空格', () => {
    const tokens = tokenizeText('中文　中文'); // 中间为全角空格
    const spaceToken = tokens.find(t => t.char === '　');
    expect(spaceToken?.type).toBe('space');
    expect(spaceToken?.attachToPrevious).toBe(true);
  });
});
