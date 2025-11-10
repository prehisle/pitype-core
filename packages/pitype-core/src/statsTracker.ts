import type { TypingEvent } from './typingSession.js';
import { TypingSession } from './typingSession.js';

export interface StatsSnapshot {
  startedAt?: number;
  durationMs: number;
  correctChars: number;
  totalChars: number;
  accuracy: number;
  correctCpm: number;
  totalCpm: number;
  wpm: number;
  completed: boolean;
}

export interface StatsTracker {
  getSnapshot(): StatsSnapshot;
}

export function createStatsTracker(session: TypingSession): StatsTracker {
  return new StatsTrackerImpl(session);
}

class StatsTrackerImpl implements StatsTracker {
  private startedAt?: number;
  private lastTimestamp?: number;
  private correctChars = 0;
  private totalChars = 0;
  private completed = false;

  constructor(session: TypingSession) {
    session.subscribe((event) => this.handleEvent(event));
  }

  getSnapshot(): StatsSnapshot {
    const durationMs = this.computeDuration();
    const minutes = durationMs > 0 ? durationMs / 60000 : 0;

    return {
      startedAt: this.startedAt,
      durationMs,
      correctChars: this.correctChars,
      totalChars: this.totalChars,
      accuracy:
        this.totalChars === 0 ? 100 : Math.round((this.correctChars / this.totalChars) * 100),
      correctCpm: minutes > 0 ? Math.round(this.correctChars / minutes) : 0,
      totalCpm: minutes > 0 ? Math.round(this.totalChars / minutes) : 0,
      wpm: minutes > 0 ? Math.round(this.correctChars / minutes / 5) : 0,
      completed: this.completed
    };
  }

  private handleEvent(event: TypingEvent): void {
    switch (event.type) {
      case 'session:start':
        this.startedAt = event.timestamp;
        this.lastTimestamp = event.timestamp;
        this.completed = false;
        this.correctChars = 0;
        this.totalChars = 0;
        break;
      case 'input:evaluate':
        this.lastTimestamp = event.timestamp;
        this.totalChars += 1;
        if (event.correct) this.correctChars += 1;
        break;
      case 'input:undo':
        this.lastTimestamp = event.timestamp;
        if (this.totalChars > 0) this.totalChars -= 1;
        if (event.correct && this.correctChars > 0) this.correctChars -= 1;
        this.completed = false;
        break;
      case 'session:complete':
        this.lastTimestamp = event.timestamp;
        this.completed = true;
        break;
      case 'session:reset':
        this.startedAt = undefined;
        this.lastTimestamp = undefined;
        this.totalChars = 0;
        this.correctChars = 0;
        this.completed = false;
        break;
    }
  }

  private computeDuration(): number {
    if (this.startedAt === undefined) {
      return 0;
    }
    const last = this.lastTimestamp ?? this.startedAt;
    return Math.max(0, last - this.startedAt);
  }
}
