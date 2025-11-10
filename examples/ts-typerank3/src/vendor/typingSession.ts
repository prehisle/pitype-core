import { createTextSource, TextSource } from './textSource';
import { Token } from './tokenizer';

export interface TypingSessionOptions {
  text?: string;
  source?: TextSource;
  tokens?: Token[];
  now?: () => number;
}

export interface SessionState {
  text: string;
  position: number;
  entries: InputEntry[];
  complete: boolean;
  sourceId?: string;
  locale?: string;
}

export interface InputEntry {
  index: number;
  expected: string;
  actual: string;
  correct: boolean;
}

export type SessionEvent =
  | { type: 'session:start'; timestamp: number }
  | { type: 'session:complete'; timestamp: number }
  | { type: 'session:reset'; timestamp: number }
  | ({
      type: 'input:evaluate';
      timestamp: number;
    } & InputEntry)
  | ({
      type: 'input:undo';
      timestamp: number;
    } & InputEntry);

export type SessionListener = (event: SessionEvent) => void;

export class TypingSession {
  private listeners = new Set<SessionListener>();
  private entries: InputEntry[] = [];
  private position = 0;
  private completed = false;
  private readonly text: string;
  private readonly now: () => number;
  private readonly tokens: Token[];
  private readonly locale?: string;
  private readonly sourceId?: string;
  private startedAt?: number;

  constructor(options: TypingSessionOptions) {
    const source = options?.source ?? createTextSourceFromOptions(options);

    if (!source) {
      throw new Error('TypingSession requires text or source');
    }

    this.text = source.content;
    this.now = options.now ?? (() => Date.now());
    this.tokens = source.tokens;
    this.locale = source.locale;
    this.sourceId = source.id;
  }

  subscribe(listener: SessionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): SessionState {
    return {
      text: this.text,
      position: this.position,
      entries: [...this.entries],
      complete: this.completed,
      sourceId: this.sourceId,
      locale: this.locale
    };
  }

  isComplete(): boolean {
    return this.completed;
  }

  input(chars: string): void {
    if (!chars) return;

    for (const char of chars) {
      if (this.position >= this.tokens.length) {
        this.completed = true;
        return;
      }

      if (this.startedAt === undefined) {
        this.startSession();
      }

      const expected = this.tokens[this.position]?.char ?? '';
      const timestamp = this.now();
      const correct = this.equalsInput(expected, char);

      const entry: InputEntry = {
        index: this.position,
        expected,
        actual: char,
        correct
      };

      this.entries.push(entry);
      this.position += 1;

      this.emit({ type: 'input:evaluate', timestamp, ...entry });

      if (this.position >= this.tokens.length) {
        this.completed = true;
        this.emit({ type: 'session:complete', timestamp });
        return;
      }
    }
  }

  undo(count = 1): void {
    if (count <= 0) return;

    while (count-- > 0 && this.entries.length > 0) {
      const entry = this.entries.pop()!;
      this.position = entry.index;
      this.completed = false;

      const timestamp = this.now();
      this.emit({ type: 'input:undo', timestamp, ...entry });
    }
  }

  reset(): void {
    this.entries = [];
    this.position = 0;
    this.completed = false;
    this.startedAt = undefined;
    this.emit({ type: 'session:reset', timestamp: this.now() });
  }

  private startSession(): void {
    this.startedAt = this.now();
    this.emit({ type: 'session:start', timestamp: this.startedAt });
  }

  private emit(event: SessionEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }

  private equalsInput(expected: string, actual: string): boolean {
    if (expected === actual) return true;
    if (expected === '\n' && (actual === '\n' || actual === '\r')) return true;
    return false;
  }
}

function createTextSourceFromOptions(
  options: TypingSessionOptions
): TextSource | undefined {
  if (!options?.text) return undefined;
  return createTextSource(options.text, { tokens: options.tokens });
}
