import { createStatsTracker, StatsSnapshot, StatsTracker } from './statsTracker';
import { TypingSession, SessionEvent, InputEntry } from './typingSession';
import { TextSource } from './textSource';

export interface SessionRuntimeOptions {
  snapshotIntervalMs?: number;
  onSnapshot?: (snapshot: StatsSnapshot | null) => void;
  onEvaluate?: (event: InputEntry) => void;
  onUndo?: (event: InputEntry) => void;
  onComplete?: (snapshot: StatsSnapshot) => void;
  onReset?: () => void;
}

export interface SessionRuntime {
  startSession(input: string | TextSource | TypingSession): TypingSession;
  dispose(): void;
  getSession(): TypingSession | null;
  getLatestSnapshot(): StatsSnapshot | null;
}

export function createSessionRuntime(
  options: SessionRuntimeOptions = {}
): SessionRuntime {
  const interval = options.snapshotIntervalMs ?? 1000;
  let typingSession: TypingSession | null = null;
  let statsTracker: StatsTracker | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let unsubscribe: (() => void) | null = null;

  const getSnapshot = (): StatsSnapshot | null =>
    statsTracker ? statsTracker.getSnapshot() : null;

  const notifySnapshot = (): void => {
    options.onSnapshot?.(getSnapshot());
  };

  const startTimer = (): void => {
    if (interval <= 0 || timer) return;
    timer = setInterval(() => {
      notifySnapshot();
    }, interval);
  };

  const stopTimer = (): void => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const teardownSession = (): void => {
    stopTimer();
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    typingSession = null;
    statsTracker = null;
  };

  const handleSessionEvent = (event: SessionEvent): void => {
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
        options.onComplete?.(getSnapshot()!);
        break;

      case 'session:reset':
        stopTimer();
        notifySnapshot();
        options.onReset?.();
        break;
    }
  };

  const dispose = (): void => {
    teardownSession();
    notifySnapshot();
  };

  const startSession = (
    input: string | TextSource | TypingSession
  ): TypingSession => {
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

function createSessionFromInput(
  input: string | TextSource | TypingSession
): TypingSession {
  if (typeof input === 'string') {
    return new TypingSession({ text: input });
  }

  if (input instanceof TypingSession) {
    return input;
  }

  if (typeof input === 'object' && 'content' in input && 'tokens' in input) {
    return new TypingSession({ source: input });
  }

  return new TypingSession(input as any);
}
