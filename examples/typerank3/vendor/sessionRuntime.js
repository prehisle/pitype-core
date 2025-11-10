import { createStatsTracker } from './statsTracker.js';
import { TypingSession } from './typingSession.js';
export function createSessionRuntime(options = {}) {
    const interval = options.snapshotIntervalMs ?? 1000;
    let typingSession = null;
    let statsTracker = null;
    let timer = null;
    let unsubscribe = null;
    const getSnapshot = () => (statsTracker ? statsTracker.getSnapshot() : null);
    const notifySnapshot = () => {
        options.onSnapshot?.(getSnapshot());
    };
    const startTimer = () => {
        if (interval <= 0 || timer)
            return;
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
    const handleSessionEvent = (event) => {
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
    const startSession = (input) => {
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
function createSessionFromInput(input) {
    if (typeof input === 'string') {
        return new TypingSession({ text: input });
    }
    if (typeof input === 'object' && 'content' in input && 'tokens' in input) {
        return new TypingSession({ source: input });
    }
    return new TypingSession(input);
}
