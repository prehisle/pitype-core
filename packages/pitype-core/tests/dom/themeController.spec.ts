import { describe, expect, it, vi } from 'vitest';
import { createDomThemeController } from '../../src/dom/themeController.js';

class FakeClassList {
  private tokens = new Set<string>();

  add(...tokens: string[]) {
    tokens.forEach((token) => this.tokens.add(token));
  }

  remove(...tokens: string[]) {
    tokens.forEach((token) => this.tokens.delete(token));
  }

  contains(token: string): boolean {
    return this.tokens.has(token);
  }

  values(): string[] {
    return Array.from(this.tokens);
  }
}

class FakeElement {
  public classList = new FakeClassList();
  private attrs = new Map<string, string>();
  private listeners = new Map<string, Set<(event: Event) => void>>();

  constructor(theme?: string) {
    if (theme) {
      this.setAttribute('data-theme', theme);
    }
  }

  setAttribute(name: string, value: string) {
    this.attrs.set(name, value);
  }

  getAttribute(name: string): string | null {
    return this.attrs.get(name) ?? null;
  }

  addEventListener(type: string, handler: (event: Event) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);
  }

  removeEventListener(type: string, handler: (event: Event) => void) {
    this.listeners.get(type)?.delete(handler);
  }

  click() {
    this.listeners.get('click')?.forEach((handler) => handler({} as Event));
  }
}

class FakeDocument {
  constructor(private nodes: FakeElement[]) {}

  querySelectorAll(selector: string) {
    if (selector.includes('.pitype-theme-option')) {
      return this.nodes;
    }
    return [];
  }
}

class FakeStorage {
  private data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe('createDomThemeController', () => {
  it('应用存储的主题并同步选项状态', () => {
    const storage = new FakeStorage();
    storage.setItem('theme', 'nord');
    const options = [new FakeElement('dracula'), new FakeElement('nord')];
    const doc = new FakeDocument(options);
    const body = new FakeElement();

    const controller = createDomThemeController({
      storage,
      documentRef: doc as unknown as Document,
      target: body as unknown as HTMLElement,
      themes: ['dracula', 'nord'],
      defaultTheme: 'dracula'
    });

    controller.init();

    expect(body.classList.contains('theme-nord')).toBe(true);
    expect(body.classList.contains('pitype-theme-nord')).toBe(true);
    expect(options[1].classList.contains('active')).toBe(true);
  });

  it('点击主题选项会更新存储与样式', () => {
    const storage = new FakeStorage();
    const options = [new FakeElement('dracula'), new FakeElement('nord')];
    const doc = new FakeDocument(options);
    const body = new FakeElement();

    const controller = createDomThemeController({
      storage,
      documentRef: doc as unknown as Document,
      target: body as unknown as HTMLElement,
      themes: ['dracula', 'nord'],
      defaultTheme: 'dracula'
    });

    controller.init();
    options[1].click();

    expect(storage.getItem('theme')).toBe('nord');
    expect(body.classList.contains('theme-nord')).toBe(true);
    expect(body.classList.contains('pitype-theme-nord')).toBe(true);
    expect(options[1].classList.contains('active')).toBe(true);
  });

  it('无效主题会退回默认值并触发回调', () => {
    const onThemeChange = vi.fn();
    const body = new FakeElement();
    const controller = createDomThemeController({
      target: body as unknown as HTMLElement,
      themes: ['dracula', 'nord'],
      defaultTheme: 'dracula',
      onThemeChange
    });

    controller.applyTheme('unknown');

    expect(body.classList.values()).toHaveLength(0);
    expect(onThemeChange).toHaveBeenCalledWith('dracula');
  });
});
