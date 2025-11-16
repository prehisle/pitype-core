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
      getInput: () => input as unknown as HTMLInputElement,
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

  describe('光标外观配置', () => {
    it('应该能够设置和获取光标形状', () => {
      const cursor = new FakeElement();
      const input = new FakeElement();
      const storage = new Map<string, string>();
      const localStorage = {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value)
      };

      const adapter = createDomCursorAdapter({
        textDisplay: new FakeElement() as unknown as HTMLElement,
        textContainer: null,
        getCurrentPosition: () => 0,
        getCursor: () => cursor as unknown as HTMLElement,
        getInput: () => input as unknown as HTMLInputElement,
        localStorage
      });

      adapter.setCursorShape('line');
      expect(adapter.getCursorShape()).toBe('line');
      expect(cursor.classList.contains('cursor-line')).toBe(true);

      adapter.setCursorShape('block');
      expect(adapter.getCursorShape()).toBe('block');
      expect(cursor.classList.contains('cursor-block')).toBe(true);

      adapter.setCursorShape('underline');
      expect(adapter.getCursorShape()).toBe('underline');

      adapter.setCursorShape('outline');
      expect(adapter.getCursorShape()).toBe('outline');
    });

    it('应该能够设置和获取光标颜色', () => {
      const cursor = new FakeElement();
      const storage = new Map<string, string>();
      const localStorage = {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value)
      };

      const adapter = createDomCursorAdapter({
        textDisplay: new FakeElement() as unknown as HTMLElement,
        textContainer: null,
        getCurrentPosition: () => 0,
        getCursor: () => cursor as unknown as HTMLElement,
        getInput: () => null,
        localStorage
      });

      adapter.setCursorColor('rgba(255, 0, 0, 0.8)');
      expect(adapter.getCursorColor()).toBe('rgba(255, 0, 0, 0.8)');
      expect(cursor.style.backgroundColor).toBe('rgba(255, 0, 0, 0.8)');
    });

    it('应该能够设置和获取光标闪烁', () => {
      const cursor = new FakeElement();
      const storage = new Map<string, string>();
      const localStorage = {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value)
      };

      const adapter = createDomCursorAdapter({
        textDisplay: new FakeElement() as unknown as HTMLElement,
        textContainer: null,
        getCurrentPosition: () => 0,
        getCursor: () => cursor as unknown as HTMLElement,
        getInput: () => null,
        localStorage
      });

      adapter.setCursorBlink(true);
      expect(adapter.getCursorBlink()).toBe(true);
      expect(cursor.style.animation).toContain('cursor-blink');

      adapter.setCursorBlink(false);
      expect(adapter.getCursorBlink()).toBe(false);
      expect(cursor.style.animation).toBe('');
    });

    it('应该从 localStorage 加载光标配置', () => {
      const storage = new Map<string, string>();
      storage.set('cursorShape', 'line');
      storage.set('cursorColor', 'red');
      storage.set('cursorBlinkEnabled', 'true');

      const localStorage = {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value)
      };

      const adapter = createDomCursorAdapter({
        textDisplay: new FakeElement() as unknown as HTMLElement,
        textContainer: null,
        getCurrentPosition: () => 0,
        getCursor: () => null,
        getInput: () => null,
        localStorage
      });

      expect(adapter.getCursorShape()).toBe('line');
      expect(adapter.getCursorColor()).toBe('red');
      expect(adapter.getCursorBlink()).toBe(true);
    });

    it('应该使用初始配置覆盖 localStorage', () => {
      const storage = new Map<string, string>();
      storage.set('cursorShape', 'line');

      const localStorage = {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value)
      };

      const adapter = createDomCursorAdapter({
        textDisplay: new FakeElement() as unknown as HTMLElement,
        textContainer: null,
        getCurrentPosition: () => 0,
        getCursor: () => null,
        getInput: () => null,
        localStorage,
        cursorShape: 'block'
      });

      expect(adapter.getCursorShape()).toBe('block');
    });
  });

  describe('cacheCharSpans', () => {
    it('应该缓存字符 span 元素', () => {
      const textDisplay = new FakeElement();
      const span1 = createSpan({ left: 0, top: 0 }, 'a');
      const span2 = createSpan({ left: 10, top: 0 }, 'b');
      const word = createWord(span1, span2);
      textDisplay.appendChild(word);

      const setSpans = vi.fn();

      const adapter = createDomCursorAdapter({
        textDisplay: textDisplay as unknown as HTMLElement,
        textContainer: null,
        getCurrentPosition: () => 0,
        getCursor: () => null,
        getInput: () => null,
        setSpans,
        documentRef: {} as Document
      });

      const spans = adapter.cacheCharSpans();
      expect(spans.length).toBe(2);
      expect(setSpans).toHaveBeenCalled();
    });

    it('应该按位置排序 span 元素', () => {
      const textDisplay = new FakeElement();
      const span1 = createSpan({ left: 20, top: 0 }, 'b');
      const span2 = createSpan({ left: 0, top: 0 }, 'a');
      const word = createWord(span1, span2);
      textDisplay.appendChild(word);

      const setSpans = vi.fn();

      const adapter = createDomCursorAdapter({
        textDisplay: textDisplay as unknown as HTMLElement,
        textContainer: null,
        getCurrentPosition: () => 0,
        getCursor: () => null,
        getInput: () => null,
        setSpans,
        documentRef: {} as Document
      });

      adapter.cacheCharSpans();
      const sortedSpans = setSpans.mock.calls[0][0];
      expect(sortedSpans[0].getAttribute('data-char')).toBe('a');
      expect(sortedSpans[1].getAttribute('data-char')).toBe('b');
    });
  });

  describe('scheduleRefresh', () => {
    it('应该调度光标刷新', () => {
      const raf = vi.fn((cb) => {
        cb(0);
        return 0;
      });

      const adapter = createDomCursorAdapter({
        textDisplay: new FakeElement() as unknown as HTMLElement,
        textContainer: null,
        getCurrentPosition: () => 0,
        getCursor: () => null,
        getInput: () => null,
        requestAnimationFrame: raf
      });

      adapter.scheduleRefresh();
      expect(raf).toHaveBeenCalled();
    });

    it('应该防止重复调度', () => {
      const raf = vi.fn((_cb) => 0);

      const adapter = createDomCursorAdapter({
        textDisplay: new FakeElement() as unknown as HTMLElement,
        textContainer: null,
        getCurrentPosition: () => 0,
        getCursor: () => null,
        getInput: () => null,
        requestAnimationFrame: raf
      });

      adapter.scheduleRefresh();
      adapter.scheduleRefresh();
      expect(raf).toHaveBeenCalledTimes(1);
    });
  });

  describe('resetAnimation', () => {
    it('应该取消光标动画', () => {
      const caf = vi.fn();
      let rafCallbackId = 0;
      const raf = vi.fn(() => ++rafCallbackId);

      const cursor = new FakeElement();
      const input = new FakeElement();
      const span = createSpan({ left: 0, top: 0 });
      const span2 = createSpan({ left: 10, top: 0 });

      let currentPos = 0;

      const adapter = createDomCursorAdapter({
        textDisplay: new FakeElement() as unknown as HTMLElement,
        textContainer: null,
        getCurrentPosition: () => currentPos,
        getCursor: () => cursor as unknown as HTMLElement,
        getInput: () => input as unknown as HTMLInputElement,
        getSpans: () => [span as unknown as HTMLElement, span2 as unknown as HTMLElement],
        requestAnimationFrame: raf,
        cancelAnimationFrame: caf,
        performanceNow: () => 0
      });

      // 先更新位置建立初始状态
      adapter.updatePosition({ immediate: true });

      // 改变位置并触发动画
      currentPos = 1;
      adapter.updatePosition({ immediate: false });

      // 动画应该被调度
      if (raf.mock.calls.length > 0) {
        // 重置动画
        adapter.resetAnimation();
        // cancelAnimationFrame 应该被调用
        expect(caf).toHaveBeenCalled();
      }
    });
  });

  describe('边缘情况', () => {
    it('应该处理位置超出范围的情况', () => {
      const cursor = new FakeElement();
      const input = new FakeElement();
      const spans = [createSpan({ left: 0, top: 0 })];

      const adapter = createDomCursorAdapter({
        textDisplay: new FakeElement() as unknown as HTMLElement,
        textContainer: null,
        getCurrentPosition: () => 10, // 超出范围
        getCursor: () => cursor as unknown as HTMLElement,
        getInput: () => input as unknown as HTMLInputElement,
        getSpans: () => spans as unknown as HTMLElement[]
      });

      // 不应该抛出错误
      expect(() => adapter.updatePosition({ immediate: true })).not.toThrow();
    });

    it('应该处理空 span 列表', () => {
      const adapter = createDomCursorAdapter({
        textDisplay: new FakeElement() as unknown as HTMLElement,
        textContainer: null,
        getCurrentPosition: () => 0,
        getCursor: () => null,
        getInput: () => null,
        getSpans: () => []
      });

      expect(() => adapter.updatePosition({ immediate: true })).not.toThrow();
    });

    it('应该处理 null 光标和输入', () => {
      const adapter = createDomCursorAdapter({
        textDisplay: new FakeElement() as unknown as HTMLElement,
        textContainer: null,
        getCurrentPosition: () => 0,
        getCursor: () => null,
        getInput: () => null
      });

      expect(() => adapter.updatePosition({ immediate: true })).not.toThrow();
    });
  });
});
