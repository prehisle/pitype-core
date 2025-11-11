import type { TypingSession, TypingEvent } from './typingSession.js';
import type { TextSource } from './textSource.js';
import type { StatsSnapshot } from './statsTracker.js';

export interface RecordingData {
  /** 录制 ID */
  id: string;
  /** 文本源 */
  textSource: TextSource;
  /** 事件序列（带时间戳） */
  events: TypingEvent[];
  /** 录制开始时间（Unix 时间戳） */
  startTime: number;
  /** 录制结束时间（Unix 时间戳） */
  endTime: number;
  /** 最终统计数据 */
  finalStats?: StatsSnapshot;
  /** 录制元数据 */
  metadata?: {
    version?: string;
    userAgent?: string;
    [key: string]: any;
  };
}

export interface RecorderOptions {
  /** 自动生成的录制 ID（默认使用时间戳） */
  id?: string;
  /** 是否包含元数据（默认 true） */
  includeMetadata?: boolean;
  /** 自定义元数据 */
  customMetadata?: Record<string, any>;
}

export interface Recorder {
  /** 开始录制 */
  start(session: TypingSession, textSource: TextSource): void;
  /** 停止录制 */
  stop(finalStats?: StatsSnapshot): RecordingData | null;
  /** 获取当前录制状态 */
  isRecording(): boolean;
  /** 获取当前录制数据（录制中） */
  getCurrentRecording(): Partial<RecordingData> | null;
  /** 清空录制数据 */
  clear(): void;
}

export function createRecorder(options: RecorderOptions = {}): Recorder {
  const {
    id: customId,
    includeMetadata = true,
    customMetadata = {}
  } = options;

  let recording = false;
  let currentSession: TypingSession | null = null;
  let currentTextSource: TextSource | null = null;
  let events: TypingEvent[] = [];
  let startTime: number = 0;
  let unsubscribe: (() => void) | null = null;
  let recordingId: string = '';

  function generateId(): string {
    return customId || `recording-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  function start(session: TypingSession, textSource: TextSource): void {
    if (recording) {
      console.warn('Recording already in progress. Stop current recording first.');
      return;
    }

    // 重置状态
    recording = true;
    currentSession = session;
    currentTextSource = textSource;
    events = [];
    startTime = Date.now();
    recordingId = generateId();

    // 订阅会话事件
    unsubscribe = session.subscribe((event: TypingEvent) => {
      if (recording) {
        events.push({ ...event });
      }
    });
  }

  function stop(finalStats?: StatsSnapshot): RecordingData | null {
    if (!recording || !currentTextSource) {
      console.warn('No recording in progress.');
      return null;
    }

    // 取消订阅
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }

    const endTime = Date.now();
    recording = false;

    // 构建录制数据
    const recordingData: RecordingData = {
      id: recordingId,
      textSource: currentTextSource,
      events: [...events],
      startTime,
      endTime,
      finalStats
    };

    // 添加元数据
    if (includeMetadata) {
      recordingData.metadata = {
        version: '1.0.0',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        duration: endTime - startTime,
        eventCount: events.length,
        ...customMetadata
      };
    }

    // 清理当前状态
    currentSession = null;
    currentTextSource = null;
    events = [];

    return recordingData;
  }

  function isRecording(): boolean {
    return recording;
  }

  function getCurrentRecording(): Partial<RecordingData> | null {
    if (!recording || !currentTextSource) {
      return null;
    }

    return {
      id: recordingId,
      textSource: currentTextSource,
      events: [...events],
      startTime,
      endTime: Date.now()
    };
  }

  function clear(): void {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    recording = false;
    currentSession = null;
    currentTextSource = null;
    events = [];
    startTime = 0;
    recordingId = '';
  }

  return {
    start,
    stop,
    isRecording,
    getCurrentRecording,
    clear
  };
}

/**
 * 将录制数据序列化为 JSON 字符串
 */
export function serializeRecording(recording: RecordingData): string {
  return JSON.stringify(recording, null, 2);
}

/**
 * 从 JSON 字符串反序列化录制数据
 */
export function deserializeRecording(json: string): RecordingData {
  return JSON.parse(json) as RecordingData;
}

/**
 * 导出录制数据到文件（浏览器环境）
 */
export function exportRecordingToFile(
  recording: RecordingData,
  filename?: string
): void {
  if (typeof window === 'undefined' || typeof Blob === 'undefined') {
    throw new Error('File export is only available in browser environments');
  }

  const json = serializeRecording(recording);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${recording.id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 从文件导入录制数据（浏览器环境）
 */
export function importRecordingFromFile(file: File): Promise<RecordingData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const recording = deserializeRecording(json);
        resolve(recording);
      } catch (error) {
        reject(new Error(`Failed to parse recording file: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}
