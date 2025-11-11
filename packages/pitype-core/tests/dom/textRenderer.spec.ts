import { describe, expect, it } from 'vitest';
import { createDomTextRenderer } from '../../src/dom/textRenderer.js';
import { createTextSource } from '../../src/textSource.js';

class FakeClassList {
  private tokens = new Set<string>();

  add(...tokens: string[]): void {
    tokens.forEach((token) => this.tokens.add(token));
  }

  remove(...tokens: string[]): void {
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
  public children: FakeElement[] = [];
  public dataset: Record<string, string> = {};
  public classList = new FakeClassList();
  public tagName: string;
  public textContent = '';
  private attributes = new Map<string, string>();
  private _innerHTML = '';

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
  }

  appendChild(child: FakeElement | FakeDocumentFragment): FakeElement | FakeDocumentFragment {
    if (child instanceof FakeDocumentFragment) {
      child.children.forEach((node) => this.appendChild(node));
      return child;
    }
    this.children.push(child);
    return child;
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
    if (name.startsWith('data-')) {
      this.dataset[name.slice(5)] = value;
    }
  }

  getAttribute(name: string): string | null {
    if (name.startsWith('data-') && this.dataset[name.slice(5)] !== undefined) {
      return this.dataset[name.slice(5)];
    }
    return this.attributes.get(name) ?? null;
  }

  set innerHTML(value: string) {
    this._innerHTML = value;
    this.children = [];
  }

  get innerHTML(): string {
    return this._innerHTML;
  }
}

class FakeDocumentFragment {
  public children: FakeElement[] = [];

  appendChild(child: FakeElement): FakeElement {
    this.children.push(child);
    return child;
  }
}

class FakeDocument {
  createElement(tagName: string): FakeElement {
    return new FakeElement(tagName);
  }

  createDocumentFragment(): FakeDocumentFragment {
    return new FakeDocumentFragment();
  }
}

describe('createDomTextRenderer', () => {
  it('renders tokens into DOM nodes', () => {
    const doc = new FakeDocument();
    const display = doc.createElement('div');
    const renderer = createDomTextRenderer(display as unknown as HTMLElement, {
      documentRef: doc as unknown as Document
    });
    const source = createTextSource('Hi!');

    renderer.render(source);

    expect(display.children.length).toBeGreaterThan(0);
    const firstWord = display.children[0];
    expect(firstWord.classList.contains('word')).toBe(true);
  });

  it('creates wrappers for spaces and punctuation', () => {
    const doc = new FakeDocument();
    const display = doc.createElement('div');
    const renderer = createDomTextRenderer(display as unknown as HTMLElement, {
      documentRef: doc as unknown as Document
    });
    const source = createTextSource('Hi, world');

    renderer.render(source);

    const wrappers: FakeElement[] = [];
    display.children.forEach((child) => {
      wrappers.push(child);
      child.children.forEach((nested) => wrappers.push(nested));
    });
    const hasSpace = wrappers.some((node) => node.getAttribute('data-char') === ' ');
    const hasComma = wrappers.some((node) => node.getAttribute('data-char') === ',');
    expect(hasSpace).toBe(true);
    expect(hasComma).toBe(true);
  });

  it('applies and resets span state classes', () => {
    const doc = new FakeDocument();
    const display = doc.createElement('div');
    const renderer = createDomTextRenderer(display as unknown as HTMLElement, {
      documentRef: doc as unknown as Document
    });
    const span = doc.createElement('span');

    renderer.setSpans([span as unknown as HTMLElement]);
    renderer.applySpanState(0, true);
    expect(span.classList.contains('correct')).toBe(true);

    renderer.applySpanState(0, false);
    expect(span.classList.contains('incorrect')).toBe(true);

    renderer.resetSpanState(0);
    expect(span.classList.contains('correct')).toBe(false);
    expect(span.classList.contains('incorrect')).toBe(false);
  });

  it('preserves non-text children when preserveChildren enabled', () => {
    const doc = new FakeDocument();
    const display = doc.createElement('div');
    const persistent = doc.createElement('button');
    persistent.textContent = 'Click';
    display.appendChild(persistent);

    const renderer = createDomTextRenderer(display as unknown as HTMLElement, {
      documentRef: doc as unknown as Document,
      preserveChildren: true,
      textContentClass: 'custom-text'
    });

    renderer.render(createTextSource('abc'));

    expect(display.children.includes(persistent)).toBe(true);
    const textContainers = display.children.filter((child) => child.classList.contains('custom-text'));
    expect(textContainers.length).toBe(1);
  });
});
