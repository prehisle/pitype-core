import { afterEach, describe, expect, it } from 'vitest';
import { registerLocale, getLocaleString, clearLocales } from '../src/locale';

describe('Locale registry', () => {
  afterEach(() => {
    clearLocales();
  });

  it('retrieves strings by locale code', () => {
    registerLocale({ code: 'en', strings: { hello: 'Hello' } });
    expect(getLocaleString('en', 'hello')).toBe('Hello');
  });

  it('falls back to fallback locale', () => {
    registerLocale({ code: 'en', strings: { hello: 'Hello' } });
    registerLocale({ code: 'en-US', fallbackCode: 'en', strings: {} });
    expect(getLocaleString('en-US', 'hello')).toBe('Hello');
  });

  it('returns undefined for missing keys', () => {
    registerLocale({ code: 'en', strings: {} });
    expect(getLocaleString('en', 'bye')).toBeUndefined();
  });
});
