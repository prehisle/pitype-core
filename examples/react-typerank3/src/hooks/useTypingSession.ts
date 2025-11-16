import { useRef, useState, useCallback, useEffect } from 'react';
import {
  createSessionRuntime,
  createTextSource,
  type SessionRuntime,
  type StatsSnapshot,
  type TypingEntry
} from 'pitype-core';

interface UseTypingSessionOptions {
  onEvaluate?: (event: TypingEntry & { type: 'input:evaluate'; timestamp: number }) => void;
  onUndo?: (event: TypingEntry & { type: 'input:undo'; timestamp: number }) => void;
  onComplete?: (snapshot: StatsSnapshot | null) => void;
  onSnapshot?: (snapshot: StatsSnapshot | null) => void;
}

export function useTypingSession(options: UseTypingSessionOptions = {}) {
  const runtimeRef = useRef<SessionRuntime | null>(null);
  const [snapshot, setSnapshot] = useState<StatsSnapshot | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // 初始化 SessionRuntime
  useEffect(() => {
    runtimeRef.current = createSessionRuntime({
      snapshotIntervalMs: 1000,
      onEvaluate: options.onEvaluate,
      onUndo: options.onUndo,
      onComplete: (snap) => {
        setIsCompleted(true);
        setSnapshot(snap);
        options.onComplete?.(snap);
      },
      onSnapshot: (snap) => {
        setSnapshot(snap);
        options.onSnapshot?.(snap);
      }
    });

    return () => {
      runtimeRef.current?.dispose();
      runtimeRef.current = null;
    };
  }, [options.onEvaluate, options.onUndo, options.onComplete, options.onSnapshot]);

  const startSession = useCallback((text: string, locale: string, textId: string) => {
    if (!runtimeRef.current) return;

    const source = createTextSource(text, {
      id: textId,
      locale
    });

    setIsCompleted(false);
    setSnapshot(null);
    runtimeRef.current.startSession(source);
  }, []);

  const getSession = useCallback(() => {
    return runtimeRef.current?.getSession() || null;
  }, []);

  const getLatestSnapshot = useCallback(() => {
    return runtimeRef.current?.getLatestSnapshot() || null;
  }, []);

  return {
    runtime: runtimeRef.current,
    snapshot,
    isCompleted,
    startSession,
    getSession,
    getLatestSnapshot
  };
}
