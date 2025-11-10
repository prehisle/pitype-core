import { createStatsTracker, type StatsSnapshot, type StatsTracker } from './statsTracker.js';
import {
  TypingSession,
  type TypingEntry,
  type TypingEvent,
  type TypingSessionOptions
} from './typingSession.js';
import type { TextSource } from './textSource.js';

export interface SessionRuntimeCallbacks {
  onEvaluate?: (event: TypingEntry & { type: 'input:evaluate'; timestamp: number }) => void;
  onUndo?: (event: TypingEntry & { type: 'input:undo'; timestamp: number }) => void;
  onComplete?: (snapshot: StatsSnapshot | null) => void;
  onReset?: () => void;
  onSnapshot?: (snapshot: StatsSnapshot | null) => void;
}

export interface SessionRuntimeOptions extends SessionRuntimeCallbacks {
  /**
   * 统计快照轮询间隔（毫秒）。设为 0 或负数可禁用定时器，仅在事件发生时推送。
   * @default 1000
   */
  snapshotIntervalMs?: number;
}

export interface SessionRuntime {
  startSession(input: TextSource | TypingSessionOptions | string): TypingSession;
  dispose(): void;
  getSession(): TypingSession | null;
  getLatestSnapshot(): StatsSnapshot | null;
}

export function createSessionRuntime(options: SessionRuntimeOptions = {}): SessionRuntime {
  const interval = options.snapshotIntervalMs ?? 1000;
  let typingSession: TypingSession | null = null;
  let statsTracker: StatsTracker | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let unsubscribe: (() => void) | null = null;

  const getSnapshot = () => (statsTracker ? statsTracker.getSnapshot() : null);

  const notifySnapshot = () => {
    options.onSnapshot?.(getSnapshot());
  };

  const startTimer = () => {
    if (interval <= 0 || timer) return;
    timer = setInterval(() => {
      notifySnapshot();
    }, interval);
  };

  const stopTimer = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const teardownSession = () => {
    stopTimer();
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    typingSession = null;
    statsTracker = null;
  };

  const handleSessionEvent = (event: TypingEvent): void => {
    switch (event.type) {
      case 'session:start':
        startTimer();
        notifySnapshot();
        break;
      case 'input:evaluate':
        options.onEvaluate?.(event);
        notifySnapshot();
        break;
      case 'input:undo':
        options.onUndo?.(event);
        notifySnapshot();
        break;
      case 'session:complete':
        stopTimer();
        notifySnapshot();
        options.onComplete?.(getSnapshot());
        break;
      case 'session:reset':
        stopTimer();
        notifySnapshot();
        options.onReset?.();
        break;
    }
  };

  const dispose = () => {
    teardownSession();
    notifySnapshot();
  };

  const startSession = (input: TextSource | TypingSessionOptions | string): TypingSession => {
    teardownSession();
    const session = createSessionFromInput(input);
    typingSession = session;
    statsTracker = createStatsTracker(session);
    unsubscribe = session.subscribe(handleSessionEvent);
    notifySnapshot();
    return session;
  };

  return {
    startSession,
    dispose,
    getSession: () => typingSession,
    getLatestSnapshot: getSnapshot
  };
}

function createSessionFromInput(input: TextSource | TypingSessionOptions | string): TypingSession {
  if (typeof input === 'string') {
    return new TypingSession({ text: input });
  }

  if (typeof input === 'object' && 'content' in input && 'tokens' in input) {
    return new TypingSession({ source: input });
  }

  return new TypingSession(input);
}
