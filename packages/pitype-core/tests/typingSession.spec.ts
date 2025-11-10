import { describe, expect, it } from 'vitest';
import {
  TypingSession,
  createStatsTracker,
  createTextSource,
  type TypingEvent,
  tokenizeText
} from '../src';

class FakeClock {
  private current = 0;

  public now = () => this.current;

  public advance(ms: number) {
    this.current += ms;
    return this.current;
  }
}

const collectEvents = (session: TypingSession) => {
  const events: TypingEvent[] = [];
  session.subscribe((evt) => events.push(evt));
  return events;
};

describe('TypingSession', () => {
  it('respects pre-tokenized input when text contains punctuation', () => {
    const text = 'Hi!';
    const tokens = tokenizeText(text);
    // 模拟 session 使用 token 序列，而不是逐字符
    const session = new TypingSession({ text, tokens });
    const events = collectEvents(session);

    session.input('Hi!');

    expect(events.filter((e) => e.type === 'input:evaluate')).toHaveLength(tokens.length);
    expect(session.isComplete()).toBe(true);
  });

  it('supports creating session from TextSource locale metadata', () => {
    const source = createTextSource('ok', { locale: 'en-US' });
    const session = new TypingSession({ source });
    session.input('ok');
    expect(session.getState().locale).toBe('en-US');
    expect(session.isComplete()).toBe(true);
  });

  it('starts on first input and evaluates characters sequentially', () => {
    const clock = new FakeClock();
    const session = new TypingSession({ text: 'abc', now: clock.now });
    const events = collectEvents(session);

    session.input('ab');

    expect(events.map((e) => e.type)).toEqual([
      'session:start',
      'input:evaluate',
      'input:evaluate'
    ]);
    expect(events[1]).toMatchObject({ index: 0, expected: 'a', actual: 'a', correct: true });
    expect(events[2]).toMatchObject({ index: 1, expected: 'b', actual: 'b', correct: true });
    expect(session.getState().position).toBe(2);
  });

  it('undo reverts last evaluation and emits undo event', () => {
    const clock = new FakeClock();
    const session = new TypingSession({ text: 'abc', now: clock.now });
    const events = collectEvents(session);

    session.input('ab');
    session.undo();

    const undoEvent = events.at(-1);
    expect(undoEvent?.type).toBe('input:undo');
    expect(undoEvent).toMatchObject({ index: 1, expected: 'b', actual: 'b', correct: true });

    const state = session.getState();
    expect(state.position).toBe(1);
    expect(state.entries).toHaveLength(1);
  });

  it('emits complete event once all characters are processed', () => {
    const clock = new FakeClock();
    const session = new TypingSession({ text: 'ab', now: clock.now });
    const events = collectEvents(session);

    session.input('ab');

    expect(events.some((e) => e.type === 'session:complete')).toBe(true);
    expect(session.isComplete()).toBe(true);
  });
});

describe('StatsTracker', () => {
  it('tracks counts and CPM/TCPM/WPM based on events', () => {
    const clock = new FakeClock();
    const session = new TypingSession({ text: 'ab', now: clock.now });
    const tracker = createStatsTracker(session);

    session.input('a'); // correct at t=0
    clock.advance(30000);
    session.input('x'); // incorrect at t=30s

    const snapshot = tracker.getSnapshot();
    expect(snapshot.correctChars).toBe(1);
    expect(snapshot.totalChars).toBe(2);
    expect(snapshot.accuracy).toBeCloseTo(50);
    expect(snapshot.correctCpm).toBe(2);
    expect(snapshot.totalCpm).toBe(4);
    expect(snapshot.wpm).toBe(0);
    expect(snapshot.durationMs).toBe(30000);
  });

  it('updates totals when undo is called', () => {
    const clock = new FakeClock();
    const session = new TypingSession({ text: 'ab', now: clock.now });
    const tracker = createStatsTracker(session);

    session.input('a');
    clock.advance(5000);
    session.input('x');
    session.undo();

    const snapshot = tracker.getSnapshot();
    expect(snapshot.correctChars).toBe(1);
    expect(snapshot.totalChars).toBe(1);
    expect(snapshot.accuracy).toBe(100);
    expect(snapshot.durationMs).toBe(5000);
  });
});
