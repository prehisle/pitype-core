import { describe, expect, it, vi } from 'vitest';
import { createDomCursorAdapter } from '../../src/dom/cursorAdapter.js';

class FakeClassList {
  private items = new Set<string>();
  add(...tokens: string[]) {
    tokens.forEach((token) => this.items.add(token));
  }
  remove(...tokens: string[]) {
    tokens.forEach((token) => this.items.delete(token));
  }
  contains(token: string) {
    return this.items.has(token);
  }
}

class FakeElement {
  public children: FakeElement[] = [];
  public classList = new FakeClassList();
  public style: Record<string, string> = {};
  public dataset: Record<string, string> = {};
  public scrollTop = 0;
  public scrollLeft = 0;
  public clientHeight = 100;
  private attrs = new Map<string, string>();
  private listeners = new Map<string, Set<(event: Event) => void>>();

  constructor(private rect: DOMRectInit = {}) {}

  appendChild(child: FakeElement) {
    this.children.push(child);
    return child;
  }

  setAttribute(name: string, value: string) {
    this.attrs.set(name, value);
    if (name.startsWith('data-')) {
      this.dataset[name.slice(5)] = value;
    }
  }

  getAttribute(name: string): string | null {
    if (name.startsWith('data-') && this.dataset[name.slice(5)] !== undefined) {
      return this.dataset[name.slice(5)];
    }
    return this.attrs.get(name) ?? null;
  }

  querySelectorAll(selector: string): FakeElement[] {
    if (selector === '.word') {
      return this.children.filter((child) => child.classList.contains('word'));
    }
    return [];
  }

  getBoundingClientRect(): DOMRect {
    return {
      x: this.rect.left ?? 0,
      y: this.rect.top ?? 0,
      left: this.rect.left ?? 0,
      top: this.rect.top ?? 0,
      width: this.rect.width ?? 10,
      height: this.rect.height ?? 20,
      right: (this.rect.left ?? 0) + (this.rect.width ?? 10),
      bottom: (this.rect.top ?? 0) + (this.rect.height ?? 20)
    } as DOMRect;
  }

  addEventListener(type: string, handler: (event: Event) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);
  }

  dispatch(type: string) {
    this.listeners.get(type)?.forEach((handler) => handler({} as Event));
  }

  scrollTo(options: ScrollToOptions) {
    this.scrollTop = Number(options.top) || 0;
  }
}

describe('createDomCursorAdapter', () => {
  const createSpan = (rect: DOMRectInit, dataChar = 'a') => {
    const span = new FakeElement(rect);
    span.setAttribute('data-char', dataChar);
    return span;
  };

  const createWord = (...children: FakeElement[]) => {
    const word = new FakeElement();
    word.classList.add('word');
    children.forEach((child) => word.appendChild(child));
    return word;
  };

  it('updates cursor and input transforms based on current position', () => {
    const cursor = new FakeElement();
    const input = new FakeElement();
    const span = createSpan({ left: 10, top: 5, width: 8, height: 16 });
    const word = createWord(span);
    const textDisplay = new FakeElement();
    textDisplay.appendChild(word);

    const adapter = createDomCursorAdapter({
      textDisplay: textDisplay as unknown as HTMLElement,
      textContainer: new FakeElement() as unknown as HTMLElement,
      getCurrentPosition: () => 0,
      getCursor: () => cursor as unknown as HTMLElement,
      getInput: () => (input as unknown as HTMLInputElement),
      getSpans: () => [span as unknown as HTMLElement],
      windowRef: undefined,
      documentRef: undefined,
      requestAnimationFrame: (cb) => {
        cb(0);
        return 0;
      },
      cancelAnimationFrame: () => {},
      performanceNow: () => 0
    });

    adapter.updatePosition({ immediate: true });

    expect(cursor.style.transform).toContain('translate3d(10px, 5px, 0)');
    expect(input.style.transform).toContain('translate3d(10px, 5px, 0)');
  });

  it('focuses input on mobile user agents when enabled', () => {
    const textDisplay = new FakeElement();
    const focus = vi.fn();
    const adapter = createDomCursorAdapter({
      textDisplay: textDisplay as unknown as HTMLElement,
      textContainer: null,
      getCurrentPosition: () => 0,
      getCursor: () => null,
      getInput: () =>
        ({
          focus
        }) as unknown as HTMLInputElement,
      navigatorRef: { userAgent: 'Android' } as Navigator
    });

    adapter.enableMobileSupport();
    textDisplay.dispatch('click');
    expect(focus).toHaveBeenCalled();
  });

  it('schedules layout refresh on resize', () => {
    const textDisplay = new FakeElement();
    const container = new FakeElement();
    const adapter = createDomCursorAdapter({
      textDisplay: textDisplay as unknown as HTMLElement,
      textContainer: container as unknown as HTMLElement,
      getCurrentPosition: () => 0,
      getCursor: () => null,
      getInput: () => null,
      getSpans: () => [],
      setSpans: vi.fn(),
      windowRef: {
        addEventListener: (type: string, handler: () => void) => {
          if (type === 'resize') {
            handler();
          }
        },
        removeEventListener: () => {}
      } as unknown as Window,
      requestAnimationFrame: (cb) => {
        cb(0);
        return 0;
      },
      cancelAnimationFrame: () => {}
    });

    adapter.enableResponsiveSync();
    expect(container.scrollTop).toBeGreaterThanOrEqual(0);
  });
});
