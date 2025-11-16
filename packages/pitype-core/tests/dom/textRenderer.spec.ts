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
  public firstChild: FakeElement | null = null;

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
  }

  appendChild(child: FakeElement | FakeDocumentFragment): FakeElement | FakeDocumentFragment {
    if (child instanceof FakeDocumentFragment) {
      child.children.forEach((node) => this.appendChild(node));
      return child;
    }
    this.children.push(child);
    if (this.children.length === 1) {
      this.firstChild = child;
    }
    return child;
  }

  insertBefore(newNode: FakeElement, referenceNode: FakeElement | null): FakeElement {
    if (!referenceNode) {
      return this.appendChild(newNode) as FakeElement;
    }
    const index = this.children.indexOf(referenceNode);
    if (index >= 0) {
      this.children.splice(index, 0, newNode);
    } else {
      this.children.push(newNode);
    }
    if (this.children.length > 0) {
      this.firstChild = this.children[0];
    }
    return newNode;
  }

  remove(): void {
    // Simplified remove - in real DOM this would remove from parent
  }

  querySelectorAll(selector: string): FakeElement[] {
    const results: FakeElement[] = [];
    const className = selector.startsWith('.') ? selector.slice(1) : selector;

    const traverse = (element: FakeElement) => {
      if (element.classList.contains(className)) {
        results.push(element);
      }
      element.children.forEach(traverse);
    };

    traverse(this);
    return results;
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
    this.firstChild = null;
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
    // Content is wrapped in a .pitype-text-content container
    const contentWrapper = display.children[0];
    expect(contentWrapper.classList.contains('pitype-text-content')).toBe(true);
    expect(contentWrapper.children.length).toBeGreaterThan(0);
    const firstWord = contentWrapper.children[0];
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

    // Content is wrapped in a .pitype-text-content container
    const contentWrapper = display.children[0];
    const wrappers: FakeElement[] = [];
    contentWrapper.children.forEach((child) => {
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

  it('attaches default CJK punctuation to previous characters', () => {
    const doc = new FakeDocument();
    const display = doc.createElement('div');
    const renderer = createDomTextRenderer(display as unknown as HTMLElement, {
      documentRef: doc as unknown as Document
    });
    const source = createTextSource('稳定的节奏胜过瞬间的爆发。');

    renderer.render(source);

    const contentWrapper = display.children[0];
    const spans = collectCharSpans(contentWrapper);
    const punctuationIndex = spans.findIndex((node) => node.getAttribute('data-char') === '。');
    const punctuation = spans[punctuationIndex];
    const previous = spans[punctuationIndex - 1];
    expect(punctuation?.classList.contains('no-break')).toBe(true);
    expect(previous?.classList.contains('no-break')).toBe(true);
  });

  it('attaches default opening punctuation to following characters', () => {
    const doc = new FakeDocument();
    const display = doc.createElement('div');
    const renderer = createDomTextRenderer(display as unknown as HTMLElement, {
      documentRef: doc as unknown as Document
    });
    const source = createTextSource('“感受节奏”');

    renderer.render(source);

    const spans = collectCharSpans(display.children[0]);
    const openingIndex = spans.findIndex((node) => node.getAttribute('data-char') === '“');
    const opening = spans[openingIndex];
    const nextChar = spans[openingIndex + 1];
    expect(opening?.classList.contains('no-break')).toBe(true);
    expect(nextChar?.classList.contains('no-break')).toBe(true);
  });

  it('supports custom line break matchers', () => {
    const doc = new FakeDocument();
    const display = doc.createElement('div');
    const renderer = createDomTextRenderer(display as unknown as HTMLElement, {
      documentRef: doc as unknown as Document,
      lineBreakOptions: {
        disableDefaultCjk: true,
        matchers: [
          ({ token, previousToken }) => {
            if (token.char === '度' && previousToken?.language === 'english') {
              return { attachToPrevious: true };
            }
            return undefined;
          }
        ]
      }
    });

    renderer.render(createTextSource('42度'));

    const spans = collectCharSpans(display.children[0]);
    const degreeIndex = spans.findIndex((node) => node.getAttribute('data-char') === '度');
    const degree = spans[degreeIndex];
    const previous = spans[degreeIndex - 1];
    expect(degree?.classList.contains('no-break')).toBe(true);
    expect(previous?.classList.contains('no-break')).toBe(true);
  });
});

function collectCharSpans(root: FakeElement): FakeElement[] {
  const spans: FakeElement[] = [];

  const traverse = (node: FakeElement) => {
    if (node.getAttribute('data-char')) {
      spans.push(node);
    }
    node.children.forEach(traverse);
  };

  traverse(root);
  return spans;
}
