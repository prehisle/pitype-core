import type { TypingEvent } from './typingSession.js';
import type { RecordingData } from './recorder.js';

export interface PlayerOptions {
  /** 录制数据 */
  recording: RecordingData;
  /** 播放速度（1.0 = 正常速度，2.0 = 2倍速） */
  playbackSpeed?: number;
  /** 事件回调 */
  onEvent?: (event: TypingEvent, currentTime: number) => void;
  /** 播放完成回调 */
  onComplete?: () => void;
  /** 播放进度更新回调（毫秒间隔） */
  onProgress?: (currentTime: number, duration: number) => void;
  /** 进度更新间隔（毫秒，默认 100） */
  progressInterval?: number;
}

export type PlayerState = 'idle' | 'playing' | 'paused' | 'completed';

export interface Player {
  /** 开始播放 */
  play(): void;
  /** 暂停播放 */
  pause(): void;
  /** 恢复播放 */
  resume(): void;
  /** 停止播放并重置 */
  stop(): void;
  /** 跳转到指定时间（毫秒） */
  seek(timestamp: number): void;
  /** 设置播放速度 */
  setSpeed(speed: number): void;
  /** 获取当前播放速度 */
  getSpeed(): number;
  /** 获取当前播放时间（毫秒） */
  getCurrentTime(): number;
  /** 获取总时长（毫秒） */
  getDuration(): number;
  /** 获取播放状态 */
  getState(): PlayerState;
  /** 是否正在播放 */
  isPlaying(): boolean;
  /** 销毁播放器 */
  destroy(): void;
}

export function createPlayer(options: PlayerOptions): Player {
  const {
    recording,
    playbackSpeed: initialSpeed = 1.0,
    onEvent,
    onComplete,
    onProgress,
    progressInterval = 100
  } = options;

  let state: PlayerState = 'idle';
  let currentSpeed = initialSpeed;
  let currentEventIndex = 0;
  let currentTime = 0;
  let startPlayTime = 0;
  let pausedTime = 0;

  let eventTimer: ReturnType<typeof setTimeout> | null = null;
  let progressTimer: ReturnType<typeof setInterval> | null = null;

  const events = recording.events;
  const duration = events.length > 0
    ? (events[events.length - 1].timestamp - events[0].timestamp)
    : 0;

  function clearTimers(): void {
    if (eventTimer !== null) {
      clearTimeout(eventTimer);
      eventTimer = null;
    }
    if (progressTimer !== null) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  }

  function startProgressTimer(): void {
    if (progressTimer !== null || !onProgress) return;

    progressTimer = setInterval(() => {
      if (state === 'playing') {
        onProgress(currentTime, duration);
      }
    }, progressInterval);
  }

  function stopProgressTimer(): void {
    if (progressTimer !== null) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  }

  function scheduleNextEvent(): void {
    if (currentEventIndex >= events.length) {
      complete();
      return;
    }

    const currentEvent = events[currentEventIndex];
    const nextEvent = events[currentEventIndex + 1];

    // 触发当前事件
    if (onEvent) {
      onEvent(currentEvent, currentTime);
    }

    currentEventIndex++;

    if (!nextEvent) {
      // 没有下一个事件了，播放完成
      complete();
      return;
    }

    // 计算到下一个事件的延迟（考虑播放速度）
    const delay = (nextEvent.timestamp - currentEvent.timestamp) / currentSpeed;

    eventTimer = setTimeout(() => {
      if (state === 'playing') {
        currentTime = nextEvent.timestamp - events[0].timestamp;
        scheduleNextEvent();
      }
    }, delay);
  }

  function play(): void {
    if (state === 'playing') return;

    if (state === 'completed') {
      // 重新开始
      stop();
    }

    state = 'playing';
    startPlayTime = Date.now() - pausedTime;

    if (events.length === 0) {
      complete();
      return;
    }

    // 如果是从头开始，触发第一个事件
    if (currentEventIndex === 0 && events.length > 0) {
      const firstEvent = events[0];
      if (onEvent) {
        onEvent(firstEvent, 0);
      }
      currentEventIndex++;
      currentTime = 0;
    }

    startProgressTimer();
    scheduleNextEvent();
  }

  function pause(): void {
    if (state !== 'playing') return;

    state = 'paused';
    pausedTime = Date.now() - startPlayTime;
    clearTimers();
    stopProgressTimer();
  }

  function resume(): void {
    if (state !== 'paused') return;
    play();
  }

  function stop(): void {
    clearTimers();
    stopProgressTimer();
    state = 'idle';
    currentEventIndex = 0;
    currentTime = 0;
    pausedTime = 0;
    startPlayTime = 0;
  }

  function complete(): void {
    clearTimers();
    stopProgressTimer();
    state = 'completed';
    currentTime = duration;
    if (onProgress) {
      onProgress(duration, duration);
    }
    if (onComplete) {
      onComplete();
    }
  }

  function seek(timestamp: number): void {
    const wasPlaying = state === 'playing';

    // 暂停播放
    if (wasPlaying) {
      pause();
    }

    // 限制时间范围
    const clampedTime = Math.max(0, Math.min(timestamp, duration));
    currentTime = clampedTime;

    // 找到对应的事件索引
    const absoluteTime = events[0].timestamp + clampedTime;
    let newIndex = 0;

    for (let i = 0; i < events.length; i++) {
      if (events[i].timestamp <= absoluteTime) {
        newIndex = i;
      } else {
        break;
      }
    }

    currentEventIndex = newIndex;

    // 触发所有已经过的事件（可选：只触发最后一个状态）
    if (onEvent && currentEventIndex < events.length) {
      onEvent(events[currentEventIndex], currentTime);
    }

    // 如果之前在播放，继续播放
    if (wasPlaying) {
      resume();
    }
  }

  function setSpeed(speed: number): void {
    const wasPlaying = state === 'playing';
    if (wasPlaying) {
      pause();
    }

    currentSpeed = Math.max(0.1, Math.min(10, speed));

    if (wasPlaying) {
      resume();
    }
  }

  function getSpeed(): number {
    return currentSpeed;
  }

  function getCurrentTime(): number {
    return currentTime;
  }

  function getDuration(): number {
    return duration;
  }

  function getState(): PlayerState {
    return state;
  }

  function isPlaying(): boolean {
    return state === 'playing';
  }

  function destroy(): void {
    clearTimers();
    stopProgressTimer();
    state = 'idle';
  }

  return {
    play,
    pause,
    resume,
    stop,
    seek,
    setSpeed,
    getSpeed,
    getCurrentTime,
    getDuration,
    getState,
    isPlaying,
    destroy
  };
}

/**
 * 获取录制数据的统计信息
 */
export function getRecordingStats(recording: RecordingData): {
  duration: number;
  eventCount: number;
  inputCount: number;
  undoCount: number;
  characterCount: number;
} {
  const events = recording.events;
  const duration = events.length > 0
    ? (events[events.length - 1].timestamp - events[0].timestamp)
    : 0;

  const inputCount = events.filter(e => e.type === 'input:evaluate').length;
  const undoCount = events.filter(e => e.type === 'input:undo').length;

  // 计算字符数（基于文本源）
  const characterCount = recording.textSource.content.length;

  return {
    duration,
    eventCount: events.length,
    inputCount,
    undoCount,
    characterCount
  };
}
