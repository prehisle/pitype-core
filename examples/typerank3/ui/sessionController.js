import { TypingSession, createStatsTracker } from '../vendor/index.js';

export function createSessionController({
  onEvaluate = () => {},
  onUndo = () => {},
  onComplete = () => {},
  onReset = () => {},
  onSnapshot = () => {}
} = {}) {
  let typingSession = null;
  let statsTracker = null;
  let statsTimer = null;
  let sessionUnsubscribe = null;

  const notifySnapshot = () => {
    const snapshot = statsTracker ? statsTracker.getSnapshot() : null;
    onSnapshot(snapshot);
  };

  const startStatsTimer = () => {
    if (statsTimer) return;
    statsTimer = setInterval(notifySnapshot, 1000);
  };

  const stopStatsTimer = () => {
    if (statsTimer) {
      clearInterval(statsTimer);
      statsTimer = null;
    }
  };

  const handleSessionEvent = (event) => {
    switch (event.type) {
      case 'session:start':
        startStatsTimer();
        notifySnapshot();
        break;
      case 'input:evaluate':
        onEvaluate(event.index, event.correct);
        notifySnapshot();
        break;
      case 'input:undo':
        onUndo(event.index);
        notifySnapshot();
        break;
      case 'session:complete':
        stopStatsTimer();
        notifySnapshot();
        onComplete(statsTracker ? statsTracker.getSnapshot() : null);
        break;
      case 'session:reset':
        stopStatsTimer();
        notifySnapshot();
        onReset();
        break;
      default:
        break;
    }
  };

  const dispose = () => {
    stopStatsTimer();
    if (sessionUnsubscribe) {
      sessionUnsubscribe();
      sessionUnsubscribe = null;
    }
    typingSession = null;
    statsTracker = null;
    notifySnapshot();
  };

  const startSession = (source) => {
    dispose();
    typingSession = new TypingSession({ source });
    statsTracker = createStatsTracker(typingSession);
    sessionUnsubscribe = typingSession.subscribe(handleSessionEvent);
    notifySnapshot();
    return typingSession;
  };

  return {
    startSession,
    dispose,
    getSession: () => typingSession,
    getLatestSnapshot: () => (statsTracker ? statsTracker.getSnapshot() : null)
  };
}

