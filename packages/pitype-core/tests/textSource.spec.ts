import { describe, expect, it } from 'vitest';
import { createTextSource, tokenizeText } from '../src';

describe('TextSource', () => {
  it('generates tokens automatically', () => {
    const source = createTextSource('Hello');
    expect(source.tokens).toHaveLength(5);
  });

  it('respects custom tokens and metadata', () => {
    const tokens = tokenizeText('abc');
    const source = createTextSource('ignored', {
      id: 'custom',
      locale: 'en',
      tokens
    });
    expect(source.id).toBe('custom');
    expect(source.locale).toBe('en');
    expect(source.tokens).toBe(tokens);
    expect(source.content).toBe('ignored');
  });

  it('throws when content is empty', () => {
    expect(() => createTextSource('')).toThrow();
  });
});
