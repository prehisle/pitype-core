import { describe, expect, it, vi } from 'vitest';
import { createDomInputController, type TypingSession } from '../../src';

class FakeInputElement {
  public value = '';
  public focus = vi.fn<[FocusOptions?], void>();
  private listeners = new Map<string, Set<(event: Event) => void>>();

  addEventListener(type: string, handler: (event: Event) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);
  }

  removeEventListener(type: string, handler: (event: Event) => void) {
    this.listeners.get(type)?.delete(handler);
  }

  dispatch(type: string, event: Record<string, unknown> = {}) {
    this.listeners.get(type)?.forEach((handler) => {
      handler({ target: this, ...event } as Event);
    });
  }
}

class FakeDocument {
  public activeElement: Element | null = null;
  private listeners = new Map<string, Set<(event: Event) => void>>();

  addEventListener(type: string, handler: (event: Event) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);
  }

  removeEventListener(type: string, handler: (event: Event) => void) {
    this.listeners.get(type)?.delete(handler);
  }

  emit(type: string, event: Record<string, unknown> = {}) {
    this.listeners.get(type)?.forEach((handler) => {
      handler(event as Event);
    });
  }
}

const createSessionMock = () =>
  ({
    input: vi.fn<[string], void>(),
    undo: vi.fn<[], void>()
  }) as unknown as TypingSession;

describe('createDomInputController', () => {
  it('将 input 事件转换为 TypingSession 输入', () => {
    const session = createSessionMock();
    const controller = createDomInputController({
      getTypingSession: () => session,
      getActiveElement: () => null
    });
    const input = new FakeInputElement();

    controller.attachInput(input as unknown as HTMLInputElement);

    input.value = 'a';
    input.dispatch('input');

    expect(session.input).toHaveBeenCalledWith('a');
    expect(input.value).toBe('');

    controller.destroy();
  });

  it('监听 Enter/Backspace 并自动聚焦输入框', () => {
    const session = createSessionMock();
    const documentRef = new FakeDocument();
    const controller = createDomInputController({
      getTypingSession: () => session,
      documentRef,
      getActiveElement: () => documentRef.activeElement
    });
    const input = new FakeInputElement();

    controller.attachInput(input as unknown as HTMLInputElement);
    documentRef.activeElement = null;

    documentRef.emit('keydown', {
      key: 'Enter',
      preventDefault: vi.fn()
    });

    expect(session.input).toHaveBeenCalledWith('\n');
    expect(input.focus).toHaveBeenCalled();

    documentRef.emit('keydown', {
      key: 'Backspace',
      preventDefault: vi.fn()
    });

    expect(session.undo).toHaveBeenCalled();

    controller.destroy();
  });

  it('处理组合输入并触发 onCompositionEnd', () => {
    const session = createSessionMock();
    const onCompositionEnd = vi.fn();
    const controller = createDomInputController({
      getTypingSession: () => session,
      onCompositionEnd,
      getActiveElement: () => null
    });
    const input = new FakeInputElement();

    controller.attachInput(input as unknown as HTMLInputElement);

    input.dispatch('compositionstart');
    input.value = '你';
    input.dispatch('compositionend');

    expect(onCompositionEnd).toHaveBeenCalled();
    expect(session.input).toHaveBeenCalledWith('你');

    controller.destroy();
  });
});
