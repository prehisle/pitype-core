import { describe, expect, it, vi } from 'vitest';
import {
  createSessionRuntime,
  createTextSource,
  type TypingEntry,
  type StatsSnapshot
} from '../src';

describe('createSessionRuntime', () => {
  it('转发输入/撤销/完成事件并推送快照', () => {
    const evaluateEvents: Array<TypingEntry & { timestamp: number }> = [];
    const undoEvents: Array<TypingEntry & { timestamp: number }> = [];
    const completionSnapshots: Array<StatsSnapshot | null> = [];
    const snapshots: Array<StatsSnapshot | null> = [];

    const runtime = createSessionRuntime({
      snapshotIntervalMs: 0,
      onEvaluate: (event) => evaluateEvents.push(event),
      onUndo: (event) => undoEvents.push(event),
      onComplete: (snapshot) => completionSnapshots.push(snapshot),
      onSnapshot: (snapshot) => snapshots.push(snapshot)
    });

    const source = createTextSource('abc');
    const session = runtime.startSession(source);

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]?.totalChars).toBe(0);

    session.input('a');
    session.input('x');
    session.undo();
    session.input('b');
    session.input('c');

    expect(evaluateEvents).toHaveLength(4);
    expect(evaluateEvents[0]).toMatchObject({ index: 0, correct: true });
    expect(evaluateEvents[1]).toMatchObject({ index: 1, correct: false });
    expect(undoEvents).toHaveLength(1);
    expect(undoEvents[0]).toMatchObject({ index: 1 });
    expect(completionSnapshots).toHaveLength(1);
    expect(completionSnapshots[0]?.completed).toBe(true);
    expect(snapshots.at(-1)?.totalChars).toBe(3);
  });

  it('支持定时推送快照，并在 dispose 后停止定时器', () => {
    vi.useFakeTimers();
    const onSnapshot = vi.fn();
    const runtime = createSessionRuntime({
      snapshotIntervalMs: 100,
      onSnapshot
    });

    runtime.startSession(createTextSource('ok'));
    expect(onSnapshot).toHaveBeenCalledTimes(1);

    runtime.getSession()?.input('o');
    expect(onSnapshot).toHaveBeenCalledTimes(3);

    onSnapshot.mockClear();
    vi.advanceTimersByTime(100);
    expect(onSnapshot).toHaveBeenCalledTimes(1);

    runtime.dispose();
    expect(onSnapshot).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(500);
    expect(onSnapshot).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('startSession 可以接受字符串文本并自动重置状态', () => {
    const runtime = createSessionRuntime({
      snapshotIntervalMs: 0
    });

    runtime.startSession('hi');
    const firstSnapshot = runtime.getLatestSnapshot();
    expect(firstSnapshot?.totalChars).toBe(0);

    runtime.getSession()?.input('hi');
    expect(runtime.getLatestSnapshot()?.completed).toBe(true);

    runtime.startSession('ok');
    expect(runtime.getLatestSnapshot()?.completed).toBe(false);
    expect(runtime.getLatestSnapshot()?.totalChars).toBe(0);
  });
});
