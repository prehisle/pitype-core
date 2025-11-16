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
  const optionsRef = useRef(options);
  const [snapshot, setSnapshot] = useState<StatsSnapshot | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // 更新 options ref，但不触发重新创建
  useEffect(() => {
    optionsRef.current = options;
  });

  // 初始化 SessionRuntime（只创建一次）
  useEffect(() => {
    runtimeRef.current = createSessionRuntime({
      snapshotIntervalMs: 1000,
      onEvaluate: (event) => optionsRef.current.onEvaluate?.(event),
      onUndo: (event) => optionsRef.current.onUndo?.(event),
      onComplete: (snap) => {
        setIsCompleted(true);
        setSnapshot(snap);
        optionsRef.current.onComplete?.(snap);
      },
      onSnapshot: (snap) => {
        setSnapshot(snap);
        optionsRef.current.onSnapshot?.(snap);
      }
    });

    return () => {
      runtimeRef.current?.dispose();
      runtimeRef.current = null;
    };
  }, []); // 只创建一次

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
