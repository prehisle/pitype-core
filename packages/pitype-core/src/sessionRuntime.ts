import { createStatsTracker, type StatsSnapshot, type StatsTracker } from './statsTracker.js';
import {
  TypingSession,
  type TypingEntry,
  type TypingEvent,
  type TypingSessionOptions
} from './typingSession.js';
import type { TextSource } from './textSource.js';
import type { DomAudioController } from './dom/audioController.js';
import { createRecorder, type Recorder, type RecordingData } from './recorder.js';
import { tokenizeText } from './tokenizer.js';

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

  /**
   * 音频控制器（可选）。如果提供，将自动触发音效反馈。
   */
  audioController?: DomAudioController;

  /**
   * 是否启用录制功能（默认 false）
   */
  enableRecording?: boolean;

  /**
   * 录制器配置（当 enableRecording 为 true 时使用）
   */
  recorderOptions?: {
    id?: string;
    includeMetadata?: boolean;
    customMetadata?: Record<string, any>;
  };
}

export interface SessionRuntime {
  startSession(input: TextSource | TypingSessionOptions | string): TypingSession;
  dispose(): void;
  getSession(): TypingSession | null;
  getLatestSnapshot(): StatsSnapshot | null;

  // 录制相关方法
  /** 获取录制器（如果启用） */
  getRecorder(): Recorder | null;
  /** 获取最后一次会话的录制数据 */
  getLastRecording(): RecordingData | null;
  /** 是否正在录制 */
  isRecording(): boolean;
}

export function createSessionRuntime(options: SessionRuntimeOptions = {}): SessionRuntime {
  const interval = options.snapshotIntervalMs ?? 1000;
  const audioController = options.audioController;
  const enableRecording = options.enableRecording ?? false;
  const recorderOptions = options.recorderOptions;

  let typingSession: TypingSession | null = null;
  let statsTracker: StatsTracker | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let unsubscribe: (() => void) | null = null;

  // 录制相关状态
  let recorder: Recorder | null = enableRecording ? createRecorder(recorderOptions) : null;
  let lastRecording: RecordingData | null = null;
  let currentTextSource: TextSource | null = null;

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
        // 触发音效：按键音 + 正确/错误音
        if (audioController) {
          audioController.playSound('keyPress');
          if (event.correct) {
            audioController.playSound('correct');
          } else {
            audioController.playSound('error');
          }
        }
        break;
      case 'input:undo':
        options.onUndo?.(event);
        notifySnapshot();
        break;
      case 'session:complete':
        stopTimer();
        notifySnapshot();
        const finalSnapshot = getSnapshot();
        // 停止录制（必须在 onComplete 之前，这样回调中可以获取到录制数据）
        if (recorder && recorder.isRecording()) {
          lastRecording = recorder.stop(finalSnapshot || undefined);
        }
        // 调用完成回调
        options.onComplete?.(finalSnapshot);
        // 触发完成音效
        audioController?.playSound('complete');
        break;
      case 'session:reset':
        stopTimer();
        notifySnapshot();
        options.onReset?.();
        // 停止录制（如果正在录制）
        if (recorder && recorder.isRecording()) {
          recorder.stop();
        }
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

    // 获取文本源
    currentTextSource = extractTextSource(input);

    // 开始录制（如果启用）
    if (recorder && currentTextSource) {
      recorder.start(session, currentTextSource);
    }

    notifySnapshot();
    return session;
  };

  return {
    startSession,
    dispose,
    getSession: () => typingSession,
    getLatestSnapshot: getSnapshot,
    getRecorder: () => recorder,
    getLastRecording: () => lastRecording,
    isRecording: () => recorder?.isRecording() ?? false
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

function extractTextSource(input: TextSource | TypingSessionOptions | string): TextSource | null {
  if (typeof input === 'string') {
    // 从字符串创建一个简单的 TextSource
    return {
      content: input,
      tokens: tokenizeText(input),
      id: `text-${Date.now()}`,
      locale: 'en-US'
    };
  }

  if (typeof input === 'object' && 'content' in input && 'tokens' in input) {
    return input as TextSource;
  }

  if (typeof input === 'object' && 'source' in input && input.source) {
    return input.source;
  }

  return null;
}
